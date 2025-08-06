import SwiftUI

struct ContentView: View {
    @State private var selectedTab = 0
    @EnvironmentObject var timerManager: TimerManager
    @EnvironmentObject var websiteBlocker: WebsiteBlocker
    @EnvironmentObject var soundManager: SoundManager
    
    var body: some View {
        ZStack {
            // Background gradient matching web version exactly
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.067, green: 0.024, blue: 0.137), // hsl(240, 45%, 7%)
                    Color.black
                ]),
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            
            // Grid pattern overlay
            GridPatternView()
                .opacity(0.2)
                .ignoresSafeArea()
            
            // Main content with mobile-first vertical layout (768x1200)
            VStack(spacing: 0) {
                // Header with POMOTRON logo
                VStack(spacing: 32) {
                    // Logo with exact web styling
                    Text("POMOTRON")
                        .font(.system(size: 36, weight: .black, design: .monospaced))
                        .fontWeight(.black)
                        .foregroundStyle(
                            LinearGradient(
                                colors: [
                                    Color(red: 0.945, green: 0.431, blue: 0.765), // Pink
                                    Color(red: 0.263, green: 0.824, blue: 0.824)  // Cyan
                                ],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                        .shadow(color: Color(red: 0.945, green: 0.431, blue: 0.765).opacity(0.6), radius: 8, x: 0, y: 0)
                        .shadow(color: Color(red: 0.263, green: 0.824, blue: 0.824).opacity(0.4), radius: 12, x: 0, y: 0)
                    
                    // Navigation tabs with web-style pills
                    HStack(spacing: 16) {
                        TabButton(title: "Timer", icon: "timer", isSelected: selectedTab == 0) {
                            selectedTab = 0
                        }
                        TabButton(title: "Analytics", icon: "chart.bar", isSelected: selectedTab == 1) {
                            selectedTab = 1
                        }
                        TabButton(title: "Settings", icon: "gearshape", isSelected: selectedTab == 2) {
                            selectedTab = 2
                        }
                    }
                }
                .padding(.top, 60)
                .padding(.horizontal, 40)
                
                // Content area with centered vertical layout
                VStack(spacing: 0) {
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
                .padding(.horizontal, 40)
                .padding(.vertical, 32)
                
                Spacer(minLength: 40)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// Tab Button Component
struct TabButton: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 14, weight: .medium))
                
                Text(title)
                    .font(.system(size: 14, weight: .semibold))
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(isSelected ? Color(red: 0.945, green: 0.431, blue: 0.765).opacity(0.2) : Color.clear)
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(
                                isSelected ? 
                                LinearGradient(
                                    colors: [Color(red: 0.945, green: 0.431, blue: 0.765), Color(red: 0.263, green: 0.824, blue: 0.824)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                ) : 
                                LinearGradient(colors: [Color.gray.opacity(0.3)], startPoint: .leading, endPoint: .trailing),
                                lineWidth: 2
                            )
                    )
            )
            .shadow(
                color: isSelected ? Color(red: 0.945, green: 0.431, blue: 0.765).opacity(0.3) : Color.clear,
                radius: 8
            )
        }
        .buttonStyle(PlainButtonStyle())
        .foregroundColor(isSelected ? .white : .gray)
    }
}

// Grid Pattern Component
struct GridPatternView: View {
    var body: some View {
        Canvas { context, size in
            let gridSize: CGFloat = 40
            
            // Draw grid lines
            for x in stride(from: 0, through: size.width, by: gridSize) {
                var path = Path()
                path.move(to: CGPoint(x: x, y: 0))
                path.addLine(to: CGPoint(x: x, y: size.height))
                context.stroke(path, with: .color(Color(red: 0.263, green: 0.824, blue: 0.824).opacity(0.1)), lineWidth: 1)
            }
            
            for y in stride(from: 0, through: size.height, by: gridSize) {
                var path = Path()
                path.move(to: CGPoint(x: 0, y: y))
                path.addLine(to: CGPoint(x: size.width, y: y))
                context.stroke(path, with: .color(Color(red: 0.263, green: 0.824, blue: 0.824).opacity(0.1)), lineWidth: 1)
            }
        }
        .allowsHitTesting(false)
    }
}

#Preview {
    ContentView()
        .environmentObject(TimerManager())
        .environmentObject(WebsiteBlocker())
        .environmentObject(SoundManager())
        .frame(width: 768, height: 1200)
}