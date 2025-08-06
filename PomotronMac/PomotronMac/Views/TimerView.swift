import SwiftUI

struct TimerView: View {
    @EnvironmentObject var timerManager: TimerManager
    @EnvironmentObject var websiteBlocker: WebsiteBlocker
    @EnvironmentObject var soundManager: SoundManager
    @State private var showIntentionModal = false
    @State private var selectedQuote = motivationalQuotes.randomElement() ?? motivationalQuotes[0]
    
    private var timeString: String {
        let minutes = Int(timerManager.timerState.timeLeft) / 60
        let seconds = Int(timerManager.timerState.timeLeft) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }
    
    private var sessionTypeText: String {
        if !timerManager.timerState.isRunning && !timerManager.timerState.isPaused {
            return "Ready to focus"
        } else if timerManager.timerState.isBreak {
            return "Break time - relax and recharge"
        } else {
            return timerManager.timerState.currentIntention?.task ?? "Focus time"
        }
    }
    
    private var progress: Double {
        let totalTime = timerManager.getDurationForCurrentSession() * 60
        let elapsed = totalTime - Int(timerManager.timerState.timeLeft)
        return Double(elapsed) / Double(totalTime)
    }
    
    var body: some View {
        VStack(spacing: 48) {
            // Main timer card with web-style design
            VStack(spacing: 40) {
                // Timer display with exact web styling (140px font equivalent)
                VStack(spacing: 32) {
                    Text(timeString)
                        .font(.system(size: 140, weight: .black, design: .monospaced))
                        .fontWeight(.black)
                        .foregroundStyle(
                            LinearGradient(
                                colors: [
                                    Color(red: 0.263, green: 0.824, blue: 0.824), // Cyan
                                    Color(red: 0.647, green: 0.329, blue: 0.808)  // Purple
                                ],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .shadow(color: Color(red: 0.263, green: 0.824, blue: 0.824).opacity(0.6), radius: 12, x: 0, y: 0)
                        .shadow(color: Color(red: 0.647, green: 0.329, blue: 0.808).opacity(0.4), radius: 16, x: 0, y: 0)
                    
                    // Session type and phase indicator
                    Text(sessionTypeText)
                        .font(.custom("Orbitron", size: 20))
                        .fontWeight(.medium)
                        .foregroundColor(.white.opacity(0.8))
                        .multilineTextAlignment(.center)
                    
                    // Progress bar
                    ProgressView(value: progress)
                        .progressViewStyle(RetroProgressViewStyle())
                        .frame(height: 8)
                        .padding(.horizontal, 20)
                }
                
                // Control buttons
                VStack(spacing: 20) {
                    if !timerManager.timerState.isRunning && !timerManager.timerState.isPaused {
                        // START button
                        RetroButton(
                            title: "START",
                            icon: "play.fill",
                            color: Color(red: 0.263, green: 0.824, blue: 0.824),
                            size: .large
                        ) {
                            print("START button tapped - showing intention modal")
                            showIntentionModal = true
                        }
                    } else if timerManager.timerState.isRunning {
                        // PAUSE button
                        RetroButton(
                            title: "PAUSE",
                            icon: "pause.fill",
                            color: Color(red: 0.945, green: 0.431, blue: 0.765),
                            size: .large
                        ) {
                            timerManager.pauseSession()
                            soundManager.playPauseSound()
                        }
                    } else if timerManager.timerState.isPaused {
                        // RESUME and STOP buttons
                        HStack(spacing: 16) {
                            RetroButton(
                                title: "RESUME",
                                icon: "play.fill",
                                color: Color(red: 0.263, green: 0.824, blue: 0.824),
                                size: .medium
                            ) {
                                timerManager.resumeSession()
                                soundManager.playStartSound()
                            }
                            
                            RetroButton(
                                title: "STOP",
                                icon: "stop.fill",
                                color: Color(red: 0.937, green: 0.373, blue: 0.373),
                                size: .medium
                            ) {
                                timerManager.stopSession()
                                websiteBlocker.stopBlocking()
                                soundManager.playPauseSound()
                            }
                        }
                    }
                }
            }
            .padding(32)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.black.opacity(0.4))
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color(red: 0.647, green: 0.329, blue: 0.808).opacity(0.3), lineWidth: 1)
                    )
            )
            
            // Motivational quote
            VStack(spacing: 16) {
                Text("\"\(selectedQuote.text)\"")
                    .font(.custom("Orbitron", size: 16))
                    .fontWeight(.medium)
                    .foregroundColor(.white.opacity(0.9))
                    .multilineTextAlignment(.center)
                    .lineLimit(3)
                
                Text("— \(selectedQuote.author)")
                    .font(.custom("Orbitron", size: 14))
                    .fontWeight(.regular)
                    .foregroundColor(Color(red: 0.945, green: 0.431, blue: 0.765))
            }
            .padding(24)
            .background(
                Capsule()
                    .fill(Color(red: 0.945, green: 0.431, blue: 0.765).opacity(0.1))
                    .overlay(
                        Capsule()
                            .stroke(Color(red: 0.945, green: 0.431, blue: 0.765).opacity(0.3), lineWidth: 1)
                    )
            )
            .shadow(color: Color(red: 0.945, green: 0.431, blue: 0.765).opacity(0.2), radius: 8)
            
            Spacer()
        }
        .padding(.horizontal, 24)
        .sheet(isPresented: $showIntentionModal) {
            IntentionModal { intention in
                print("Starting session with intention: \(intention)")
                timerManager.startSession(intention: intention)
                if timerManager.settings.websiteBlockingEnabled {
                    websiteBlocker.startBlocking()
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                    soundManager.playStartSound()
                }
            }
        }
        .onReceive(timerManager.$timerState) { state in
            if !state.isRunning && !state.isPaused {
                selectedQuote = motivationalQuotes.randomElement() ?? motivationalQuotes[0]
            }
        }
    }
}

// Retro Button Component
struct RetroButton: View {
    let title: String
    let icon: String
    let color: Color
    let size: ButtonSize
    let action: () -> Void
    
    enum ButtonSize {
        case small, medium, large
        
        var fontSize: CGFloat {
            switch self {
            case .small: return 12
            case .medium: return 16
            case .large: return 20
            }
        }
        
        var padding: CGFloat {
            switch self {
            case .small: return 8
            case .medium: return 14
            case .large: return 18
            }
        }
    }
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Image(systemName: icon)
                    .font(.system(size: size.fontSize, weight: .semibold))
                
                Text(title)
                    .font(.custom("Orbitron", size: size.fontSize))
                    .fontWeight(.bold)
            }
            .padding(.horizontal, size.padding * 2)
            .padding(.vertical, size.padding)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(
                        LinearGradient(
                            colors: [color.opacity(0.3), color.opacity(0.1)],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(color, lineWidth: 2)
                    )
            )
            .shadow(color: color.opacity(0.4), radius: 8)
        }
        .buttonStyle(PlainButtonStyle())
        .foregroundColor(color)
    }
}

// Retro Progress View Style
struct RetroProgressViewStyle: ProgressViewStyle {
    func makeBody(configuration: Configuration) -> some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.2))
                    .frame(height: 8)
                
                RoundedRectangle(cornerRadius: 4)
                    .fill(
                        LinearGradient(
                            colors: [
                                Color(red: 0.263, green: 0.824, blue: 0.824), // Cyan
                                Color(red: 0.647, green: 0.329, blue: 0.808), // Purple
                                Color(red: 0.945, green: 0.431, blue: 0.765)  // Pink
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(
                        width: geometry.size.width * CGFloat(configuration.fractionCompleted ?? 0),
                        height: 8
                    )
                    .shadow(color: Color(red: 0.263, green: 0.824, blue: 0.824).opacity(0.6), radius: 4)
            }
        }
        .frame(height: 8)
    }
}

// Motivational Quotes Data
struct MotivationalQuote {
    let text: String
    let author: String
}

let motivationalQuotes = [
    MotivationalQuote(text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney"),
    MotivationalQuote(text: "You don't have to be great to get started, but you have to get started to be great.", author: "Les Brown"),
    MotivationalQuote(text: "Focus is a matter of deciding what things you're not going to do.", author: "John Carmack"),
    MotivationalQuote(text: "The successful warrior is the average man with laser-like focus.", author: "Bruce Lee"),
    MotivationalQuote(text: "Concentrate all your thoughts upon the work at hand.", author: "Alexander Graham Bell"),
    MotivationalQuote(text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle"),
    MotivationalQuote(text: "The art of being wise is knowing what to overlook.", author: "William James"),
    MotivationalQuote(text: "What we plant in the soil of contemplation, we shall reap in the harvest of action.", author: "Meister Eckhart"),
    MotivationalQuote(text: "The mind is everything. What you think you become.", author: "Buddha"),
    MotivationalQuote(text: "Productivity is never an accident. It is always the result of commitment to excellence.", author: "Paul J. Meyer")
]

#Preview {
    TimerView()
        .environmentObject(TimerManager())
        .environmentObject(WebsiteBlocker())
        .environmentObject(SoundManager())
        .frame(width: 768, height: 1200)
        .background(Color.black)
}