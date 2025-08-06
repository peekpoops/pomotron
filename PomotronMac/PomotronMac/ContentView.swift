import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 0
    @EnvironmentObject var timerManager: TimerManager
    @EnvironmentObject var websiteBlocker: WebsiteBlocker
    @EnvironmentObject var soundManager: SoundManager
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Retro synthwave background gradient
                LinearGradient(
                    gradient: Gradient(stops: [
                        .init(color: Color(red: 0.1, green: 0.05, blue: 0.2), location: 0.0),
                        .init(color: Color(red: 0.2, green: 0.1, blue: 0.3), location: 0.5),
                        .init(color: Color(red: 0.15, green: 0.05, blue: 0.25), location: 1.0)
                    ]),
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                // Neon grid overlay
                NeonGridOverlay()
                
                VStack(spacing: 0) {
                    // Custom title bar
                    CustomTitleBar()
                    
                    // Main content
                    HStack(spacing: 0) {
                        // Sidebar navigation
                        VStack(spacing: 20) {
                            Spacer()
                            
                            NavigationButton(
                                title: "Timer",
                                icon: "timer",
                                isSelected: selectedTab == 0
                            ) {
                                selectedTab = 0
                            }
                            
                            NavigationButton(
                                title: "Analytics",
                                icon: "chart.bar.fill",
                                isSelected: selectedTab == 1
                            ) {
                                selectedTab = 1
                            }
                            
                            NavigationButton(
                                title: "Settings",
                                icon: "gearshape.fill",
                                isSelected: selectedTab == 2
                            ) {
                                selectedTab = 2
                            }
                            
                            Spacer()
                        }
                        .frame(width: 200)
                        .background(
                            RoundedRectangle(cornerRadius: 0)
                                .fill(Color.black.opacity(0.3))
                                .blur(radius: 1)
                        )
                        
                        // Content area
                        Group {
                            switch selectedTab {
                            case 0:
                                TimerView()
                            case 1:
                                AnalyticsView()
                            case 2:
                                SettingsView()
                            default:
                                TimerView()
                            }
                        }
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                    }
                }
            }
        }
        .onAppear {
            setupAppearance()
        }
    }
    
    private func setupAppearance() {
        // Configure app-wide appearance for retro theme
        NSApplication.shared.appearance = NSAppearance(named: .darkAqua)
    }
}

struct CustomTitleBar: View {
    var body: some View {
        HStack {
            // App icon and title
            HStack(spacing: 12) {
                Image(systemName: "timer")
                    .font(.title2)
                    .foregroundColor(.pink)
                
                Text("POMOTRON")
                    .font(.custom("Orbitron", size: 20))
                    .fontWeight(.black)
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.pink, .purple, .cyan],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
            }
            
            Spacer()
            
            // System controls placeholder
            HStack(spacing: 8) {
                Circle()
                    .fill(Color.yellow.opacity(0.8))
                    .frame(width: 12, height: 12)
                
                Circle()
                    .fill(Color.green.opacity(0.8))
                    .frame(width: 12, height: 12)
                
                Circle()
                    .fill(Color.red.opacity(0.8))
                    .frame(width: 12, height: 12)
            }
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 10)
        .background(Color.black.opacity(0.8))
    }
}

struct NavigationButton: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundColor(isSelected ? .cyan : .gray)
                
                Text(title)
                    .font(.custom("Orbitron", size: 14))
                    .fontWeight(.medium)
                    .foregroundColor(isSelected ? .white : .gray)
                
                Spacer()
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(isSelected ? Color.cyan.opacity(0.2) : Color.clear)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(isSelected ? Color.cyan : Color.clear, lineWidth: 1)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
        .padding(.horizontal, 16)
    }
}

struct NeonGridOverlay: View {
    var body: some View {
        Canvas { context, size in
            let gridSpacing: CGFloat = 50
            
            context.stroke(
                Path { path in
                    // Vertical lines
                    for x in stride(from: 0, through: size.width, by: gridSpacing) {
                        path.move(to: CGPoint(x: x, y: 0))
                        path.addLine(to: CGPoint(x: x, y: size.height))
                    }
                    
                    // Horizontal lines
                    for y in stride(from: 0, through: size.height, by: gridSpacing) {
                        path.move(to: CGPoint(x: 0, y: y))
                        path.addLine(to: CGPoint(x: size.width, y: y))
                    }
                },
                with: .color(.cyan.opacity(0.1)),
                lineWidth: 0.5
            )
        }
        .allowsHitTesting(false)
    }
}

#Preview {
    ContentView()
        .environmentObject(TimerManager())
        .environmentObject(WebsiteBlocker())
        .environmentObject(SoundManager())
}