import SwiftUI

struct TimerView: View {
    @EnvironmentObject var timerManager: TimerManager
    @EnvironmentObject var websiteBlocker: WebsiteBlocker
    @EnvironmentObject var soundManager: SoundManager
    @State private var showIntentionModal = false
    @State private var currentQuote = motivationalQuotes[0]
    @State private var showFullQuote = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Motivational Quote Banner matching web UI
                QuoteBanner(
                    quote: $currentQuote,
                    showFullQuote: $showFullQuote
                )
                
                HStack(spacing: 24) {
                    // Main Timer Section - matching web UI layout
                    VStack(spacing: 24) {
                        TimerDisplay()
                    }
                    .frame(maxWidth: 600)
                    
                    // Today's Progress Sidebar - matching web UI
                    TodaysStatsCard()
                        .frame(width: 280)
                }
                .padding(.horizontal, 24)
                
                // Timer Controls at bottom
                TimerControls()
                    .padding(.horizontal, 24)
            }
            .padding(.vertical, 24)
        }
        .sheet(isPresented: $showIntentionModal) {
            IntentionModal { intention in
                timerManager.startSession(intention: intention)
                if timerManager.settings.websiteBlockingEnabled {
                    websiteBlocker.startBlocking()
                }
                soundManager.playStartSound()
            }
        }
        .onChange(of: timerManager.timerState.isRunning) { isRunning in
            if !isRunning && websiteBlocker.isBlocking {
                websiteBlocker.stopBlocking()
            }
        }
    }
    
    // MARK: - Timer Display
    
    @ViewBuilder
    private func TimerDisplay() -> some View {
        VStack(spacing: 32) {
            // Session Type Badge - matching web UI style
            HStack(spacing: 8) {
                Image(systemName: getSessionIcon())
                    .font(.system(size: 16, weight: .medium))
                
                Text(timerManager.timerState.sessionType.displayName)
                    .font(.system(size: 16, weight: .medium, design: .default))
            }
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 25)
                    .fill(getSessionColor().opacity(0.2))
                    .overlay(
                        RoundedRectangle(cornerRadius: 25)
                            .stroke(getSessionColor(), lineWidth: 1)
                    )
            )
            .foregroundColor(getSessionColor())
            
            // Main Timer Display - exactly matching web UI colors and size
            Text(timerManager.formatTime(timerManager.timerState.timeLeft))
                .font(.system(size: 140, weight: .black, design: .default))
                .monospacedDigit()
                .foregroundStyle(
                    LinearGradient(
                        colors: [
                            Color(red: 0.44, green: 0.78, blue: 0.89), // Light cyan
                            Color(red: 0.67, green: 0.47, blue: 0.86)  // Light purple
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .shadow(color: .cyan.opacity(0.4), radius: 15)
                .shadow(color: .purple.opacity(0.3), radius: 10)
            
            // Progress Bar - matching web UI style
            VStack(spacing: 12) {
                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        // Background track
                        RoundedRectangle(cornerRadius: 4)
                            .fill(Color.gray.opacity(0.3))
                            .frame(height: 8)
                        
                        // Progress fill
                        RoundedRectangle(cornerRadius: 4)
                            .fill(
                                LinearGradient(
                                    colors: [.cyan, .purple],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .frame(width: geometry.size.width * CGFloat(timerManager.getProgress() / 100), height: 8)
                    }
                }
                .frame(height: 8)
                
                HStack {
                    Text("00:00")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    Text(timerManager.formatTime(getDurationForCurrentSession() * 60))
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            
            // Session Info
            Text(getSessionInfo())
                .font(.system(size: 14))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(40)
        .background(
            RoundedRectangle(cornerRadius: 20)
                .fill(Color.black.opacity(0.4))
                .overlay(
                    RoundedRectangle(cornerRadius: 20)
                        .stroke(
                            LinearGradient(colors: [.purple.opacity(0.3), .cyan.opacity(0.3)], startPoint: .topLeading, endPoint: .bottomTrailing),
                            lineWidth: 1
                        )
                )
        )
    }
    
    // MARK: - Timer Controls
    
    @ViewBuilder
    private func TimerControls() -> some View {
        VStack(spacing: 20) {
            // Main Control Buttons
            HStack(spacing: 16) {
                if !timerManager.timerState.isRunning && !timerManager.timerState.isPaused {
                    RetroButton(
                        title: "START",
                        icon: "play.fill",
                        color: .green,
                        size: .large
                    ) {
                        if timerManager.timerState.sessionType == .focus {
                            showIntentionModal = true
                        } else {
                            timerManager.startSession()
                            soundManager.playStartSound()
                        }
                    }
                } else if timerManager.timerState.isRunning {
                    RetroButton(
                        title: "PAUSE",
                        icon: "pause.fill",
                        color: .orange,
                        size: .medium
                    ) {
                        timerManager.pauseSession()
                        soundManager.playPauseSound()
                    }
                } else {
                    RetroButton(
                        title: "RESUME",
                        icon: "play.fill",
                        color: .green,
                        size: .medium
                    ) {
                        timerManager.resumeSession()
                        soundManager.playStartSound()
                    }
                }
                
                RetroButton(
                    title: "RESET",
                    icon: "arrow.clockwise",
                    color: .blue,
                    size: .medium
                ) {
                    timerManager.resetSession()
                    websiteBlocker.stopBlocking()
                }
                
                RetroButton(
                    title: "END",
                    icon: "stop.fill",
                    color: .red,
                    size: .medium
                ) {
                    timerManager.endSession()
                    websiteBlocker.stopBlocking()
                }
            }
            
            // Quick Settings
            HStack(spacing: 30) {
                ToggleOption(
                    title: "Auto-start",
                    isOn: $timerManager.settings.autoStart
                )
                
                ToggleOption(
                    title: "Soft start",
                    isOn: $timerManager.settings.softStart
                )
            }
        }
    }
    
    // MARK: - Helper Methods
    
    private func getSessionIcon() -> String {
        switch timerManager.timerState.sessionType {
        case .focus:
            return "brain.head.profile"
        case .shortBreak:
            return "cup.and.saucer.fill"
        case .longBreak:
            return "bed.double.fill"
        }
    }
    
    private func getSessionColor() -> Color {
        switch timerManager.timerState.sessionType {
        case .focus:
            return .cyan
        case .shortBreak:
            return .green
        case .longBreak:
            return .purple
        }
    }
    
    private func getDurationForCurrentSession() -> Int {
        switch timerManager.timerState.sessionType {
        case .focus:
            return timerManager.settings.focusDuration
        case .shortBreak:
            return timerManager.settings.breakDuration
        case .longBreak:
            return timerManager.settings.longBreakDuration
        }
    }
    
    private func getSessionInfo() -> String {
        switch timerManager.timerState.sessionType {
        case .focus:
            return "Cycle \(timerManager.timerState.currentCycle) of \(timerManager.settings.cyclesBeforeLongBreak) • Long break after \(timerManager.settings.cyclesBeforeLongBreak) cycles"
        case .shortBreak:
            return "Short break • Cycle \(timerManager.timerState.currentCycle) of \(timerManager.settings.cyclesBeforeLongBreak)"
        case .longBreak:
            return "Long break • Starting fresh after this break"
        }
    }
}

// MARK: - Supporting Views

struct QuoteBanner: View {
    @Binding var quote: MotivationalQuote
    @Binding var showFullQuote: Bool
    
    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 8) {
                Text(showFullQuote ? quote.text : String(quote.text.prefix(80)) + "...")
                    .font(.title3)
                    .italic()
                    .foregroundColor(.secondary)
                
                if showFullQuote {
                    HStack {
                        Text("— \(quote.author)")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.cyan)
                        
                        Button("New Quote") {
                            quote = motivationalQuotes.randomElement() ?? motivationalQuotes[0]
                        }
                        .font(.caption2)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.cyan.opacity(0.2))
                        .foregroundColor(.cyan)
                        .cornerRadius(4)
                    }
                }
            }
            
            Spacer()
            
            Button(showFullQuote ? "↑" : "→") {
                showFullQuote.toggle()
            }
            .font(.title2)
            .foregroundColor(.cyan)
        }
        .padding(24)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.black.opacity(0.4))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.purple.opacity(0.2), lineWidth: 1)
                )
        )
    }
}

struct CurrentIntentionCard: View {
    @EnvironmentObject var timerManager: TimerManager
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "target")
                    .foregroundColor(.cyan)
                
                Text("Current Intention")
                    .font(.headline)
                    .foregroundColor(.white)
            }
            
            VStack(alignment: .leading, spacing: 8) {
                Text("What: \(timerManager.timerState.currentIntention.task)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                if !timerManager.timerState.currentIntention.why.isEmpty {
                    Text("Why: \(timerManager.timerState.currentIntention.why)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.black.opacity(0.3))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.cyan.opacity(0.5), lineWidth: 1)
                )
        )
    }
}

struct TodaysStatsCard: View {
    @EnvironmentObject var timerManager: TimerManager
    
    var body: some View {
        let stats = timerManager.getTodaysStats()
        
        VStack(alignment: .leading, spacing: 12) {
            Text("Today's Progress")
                .font(.headline)
                .foregroundColor(.white)
            
            VStack(spacing: 8) {
                StatRow(label: "Sessions", value: "\(stats.sessions)")
                StatRow(label: "Focus Time", value: "\(stats.focusTime / 60)h \(stats.focusTime % 60)m")
                StatRow(label: "Streak", value: "\(stats.streak) days")
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.black.opacity(0.4))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.purple.opacity(0.2), lineWidth: 1)
                )
        )
    }
}

struct StatRow: View {
    let label: String
    let value: String
    
    var body: some View {
        HStack {
            Text(label)
                .font(.system(size: 13))
                .foregroundColor(.secondary)
            
            Spacer()
            
            Text(value)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.white)
        }
    }
}

struct ToggleOption: View {
    let title: String
    @Binding var isOn: Bool
    
    var body: some View {
        HStack(spacing: 12) {
            Toggle("", isOn: $isOn)
                .toggleStyle(SwitchToggleStyle(tint: .cyan))
                .scaleEffect(0.9)
            
            Text(title)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.secondary)
        }
    }
}

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
            case .medium: return 14
            case .large: return 18
            }
        }
        
        var padding: CGFloat {
            switch self {
            case .small: return 8
            case .medium: return 12
            case .large: return 16
            }
        }
    }
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: size.fontSize, weight: .medium))
                
                Text(title)
                    .font(.system(size: size.fontSize, weight: .semibold))
            }
            .padding(.horizontal, size.padding * 1.8)
            .padding(.vertical, size.padding * 1.2)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(color)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(color.opacity(0.8), lineWidth: 1)
                    )
                    .shadow(color: color.opacity(0.3), radius: 6)
                )
            )
            .foregroundColor(color)
        }
        .buttonStyle(PlainButtonStyle())
        .scaleEffect(1.0)
        .animation(.easeInOut(duration: 0.1), value: false)
    }
}

struct RetroProgressViewStyle: ProgressViewStyle {
    func makeBody(configuration: Configuration) -> some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.gray.opacity(0.3))
                    .frame(height: 8)
                
                RoundedRectangle(cornerRadius: 4)
                    .fill(
                        LinearGradient(
                            colors: [.cyan, .purple, .pink],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .frame(
                        width: geometry.size.width * CGFloat(configuration.fractionCompleted ?? 0),
                        height: 8
                    )
                    .shadow(color: .cyan, radius: 4)
            }
        }
        .frame(height: 8)
    }
}

// MARK: - Data Models

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
        .frame(width: 1000, height: 700)
}