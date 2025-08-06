import SwiftUI
import Charts

struct AnalyticsView: View {
    @EnvironmentObject var timerManager: TimerManager
    
    var body: some View {
        VStack(spacing: 32) {
            // Header
            Text("ANALYTICS")
                .font(.system(size: 36, weight: .black, design: .monospaced))
                .foregroundStyle(
                    LinearGradient(
                        colors: [
                            Color(red: 0.945, green: 0.431, blue: 0.765), // Pink
                            Color(red: 0.647, green: 0.329, blue: 0.808)  // Purple
                        ],
                        startPoint: .leading,
                        endPoint: .trailing
                    )
                )
                .shadow(color: Color(red: 0.945, green: 0.431, blue: 0.765).opacity(0.6), radius: 8)
            
            ScrollView {
                VStack(spacing: 32) {
                    // Stats Cards
                    LazyVGrid(columns: [
                        GridItem(.flexible()),
                        GridItem(.flexible())
                    ], spacing: 20) {
                        StatCard(
                            title: "TODAY",
                            value: "\(timerManager.sessionHistory.filter { Calendar.current.isDateInToday($0.startTime) }.count)",
                            subtitle: "Sessions",
                            color: Color(red: 0.263, green: 0.824, blue: 0.824)
                        )
                        
                        StatCard(
                            title: "THIS WEEK",
                            value: "\(getTotalWeeklyMinutes())",
                            subtitle: "Minutes",
                            color: Color(red: 0.945, green: 0.431, blue: 0.765)
                        )
                        
                        StatCard(
                            title: "STREAK",
                            value: "\(calculateStreak())",
                            subtitle: "Days",
                            color: Color(red: 0.647, green: 0.329, blue: 0.808)
                        )
                        
                        StatCard(
                            title: "COMPLETION",
                            value: "\(Int(getCompletionRate()))%",
                            subtitle: "Rate",
                            color: Color(red: 0.498, green: 0.831, blue: 0.275)
                        )
                    }
                    
                    // Weekly Chart
                    VStack(spacing: 20) {
                        HStack {
                            Text("Weekly Progress")
                                .font(.system(size: 24, weight: .bold, design: .monospaced))
                                .foregroundColor(.white)
                            
                            Spacer()
                        }
                        
                        if #available(macOS 13.0, *) {
                            Chart {
                                ForEach(getWeeklyData(), id: \.day) { data in
                                    BarMark(
                                        x: .value("Day", data.day),
                                        y: .value("Sessions", data.sessions)
                                    )
                                    .foregroundStyle(
                                        LinearGradient(
                                            colors: [
                                                Color(red: 0.263, green: 0.824, blue: 0.824),
                                                Color(red: 0.647, green: 0.329, blue: 0.808)
                                            ],
                                            startPoint: .bottom,
                                            endPoint: .top
                                        )
                                    )
                                }
                            }
                            .frame(height: 200)
                            .chartYAxis {
                                AxisMarks(position: .leading) { value in
                                    AxisGridLine()
                                        .foregroundStyle(Color.gray.opacity(0.3))
                                    AxisValueLabel()
                                        .foregroundStyle(.white)
                                }
                            }
                            .chartXAxis {
                                AxisMarks { value in
                                    AxisGridLine()
                                        .foregroundStyle(Color.gray.opacity(0.3))
                                    AxisValueLabel()
                                        .foregroundStyle(.white)
                                }
                            }
                        } else {
                            // Fallback for older macOS versions
                            VStack {
                                Text("Charts require macOS 13.0+")
                                    .foregroundColor(.gray)
                                    .font(.caption)
                            }
                            .frame(height: 200)
                        }
                    }
                    .padding(24)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.black.opacity(0.4))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(Color(red: 0.647, green: 0.329, blue: 0.808).opacity(0.3), lineWidth: 1)
                            )
                    )
                    
                    // Recent Sessions
                    VStack(spacing: 20) {
                        HStack {
                            Text("Recent Sessions")
                                .font(.system(size: 24, weight: .bold, design: .monospaced))
                                .foregroundColor(.white)
                            
                            Spacer()
                        }
                        
                        LazyVStack(spacing: 12) {
                            ForEach(timerManager.sessionHistory.suffix(5), id: \.id) { session in
                                SessionRow(session: session)
                            }
                        }
                    }
                    .padding(24)
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.black.opacity(0.4))
                            .overlay(
                                RoundedRectangle(cornerRadius: 16)
                                    .stroke(Color(red: 0.647, green: 0.329, blue: 0.808).opacity(0.3), lineWidth: 1)
                            )
                    )
                }
            }
        }
        .padding(.horizontal, 24)
    }
    
    private func getTotalWeeklyMinutes() -> Int {
        let calendar = Calendar.current
        let now = Date()
        let startOfWeek = calendar.dateInterval(of: .weekOfYear, for: now)?.start ?? now
        
        return timerManager.sessionHistory
            .filter { $0.startTime >= startOfWeek }
            .reduce(0) { $0 + $1.duration }
    }
    
    private func calculateStreak() -> Int {
        // Simple streak calculation
        let calendar = Calendar.current
        var streak = 0
        var currentDate = Date()
        
        while calendar.isDateInToday(currentDate) || 
              timerManager.sessionHistory.contains(where: { calendar.isDate($0.startTime, inSameDayAs: currentDate) }) {
            if timerManager.sessionHistory.contains(where: { calendar.isDate($0.startTime, inSameDayAs: currentDate) }) {
                streak += 1
            } else if !calendar.isDateInToday(currentDate) {
                break
            }
            currentDate = calendar.date(byAdding: .day, value: -1, to: currentDate) ?? currentDate
        }
        
        return streak
    }
    
    private func getCompletionRate() -> Double {
        let totalSessions = timerManager.sessionHistory.count
        let completedSessions = timerManager.sessionHistory.filter { $0.completed }.count
        
        guard totalSessions > 0 else { return 0 }
        return Double(completedSessions) / Double(totalSessions) * 100
    }
    
    private func getWeeklyData() -> [WeeklyData] {
        let calendar = Calendar.current
        let now = Date()
        
        return (0..<7).compactMap { dayOffset in
            guard let date = calendar.date(byAdding: .day, value: -dayOffset, to: now) else { return nil }
            let dayName = calendar.shortWeekdaySymbols[calendar.component(.weekday, from: date) - 1]
            let sessions = timerManager.sessionHistory.filter { calendar.isDate($0.startTime, inSameDayAs: date) }.count
            
            return WeeklyData(day: dayName, sessions: sessions)
        }.reversed()
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let subtitle: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 12) {
            Text(title)
                .font(.system(size: 12, weight: .bold, design: .monospaced))
                .foregroundColor(color)
            
            Text(value)
                .font(.system(size: 32, weight: .black, design: .monospaced))
                .foregroundColor(.white)
            
            Text(subtitle)
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.gray)
        }
        .padding(20)
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.black.opacity(0.4))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(color.opacity(0.3), lineWidth: 1)
                )
        )
        .shadow(color: color.opacity(0.2), radius: 4)
    }
}

struct SessionRow: View {
    let session: PomodoroSession
    
    var body: some View {
        HStack(spacing: 16) {
            // Session type indicator
            Circle()
                .fill(session.sessionType == .focus ? 
                      Color(red: 0.263, green: 0.824, blue: 0.824) : 
                      Color(red: 0.945, green: 0.431, blue: 0.765))
                .frame(width: 12, height: 12)
            
            // Session details
            VStack(alignment: .leading, spacing: 4) {
                Text(session.intention?.task ?? "Focus Session")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                
                Text(session.startTime, style: .time)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            // Duration and completion
            VStack(alignment: .trailing, spacing: 4) {
                Text("\(session.duration) min")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.white)
                
                if session.completed {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(Color(red: 0.498, green: 0.831, blue: 0.275))
                        .font(.caption)
                } else {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(Color(red: 0.937, green: 0.373, blue: 0.373))
                        .font(.caption)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.gray.opacity(0.1))
        )
    }
}

struct WeeklyData {
    let day: String
    let sessions: Int
}

#Preview {
    AnalyticsView()
        .environmentObject(TimerManager())
        .frame(width: 768, height: 1200)
        .background(Color.black)
}