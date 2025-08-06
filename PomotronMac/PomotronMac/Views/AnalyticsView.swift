import SwiftUI
import Charts

struct AnalyticsView: View {
    @EnvironmentObject var timerManager: TimerManager
    @State private var selectedTimeRange: TimeRange = .week
    
    enum TimeRange: String, CaseIterable {
        case week = "This Week"
        case month = "This Month"
        case year = "This Year"
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 30) {
                // Header
                VStack(spacing: 8) {
                    Text("ANALYTICS & INSIGHTS")
                        .font(.custom("Orbitron", size: 28))
                        .fontWeight(.black)
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.pink, .purple, .cyan],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                    
                    Text("Track your productivity journey")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                // Time Range Selector
                Picker("Time Range", selection: $selectedTimeRange) {
                    ForEach(TimeRange.allCases, id: \.self) { range in
                        Text(range.rawValue)
                            .tag(range)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .padding(.horizontal, 40)
                
                // Stats Overview
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible()),
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 20) {
                    StatsCard(
                        title: "Total Sessions",
                        value: "\(getStats().totalSessions)",
                        icon: "timer",
                        color: .cyan
                    )
                    
                    StatsCard(
                        title: "Focus Time",
                        value: formatFocusTime(getStats().totalFocusTime),
                        icon: "brain.head.profile",
                        color: .purple
                    )
                    
                    StatsCard(
                        title: "Completion Rate",
                        value: "\(Int(getStats().completionRate))%",
                        icon: "checkmark.circle.fill",
                        color: .green
                    )
                    
                    StatsCard(
                        title: "Current Streak",
                        value: "\(getStats().currentStreak) days",
                        icon: "flame.fill",
                        color: .orange
                    )
                }
                
                // Charts Section
                VStack(spacing: 20) {
                    // Weekly Progress Chart
                    AnalyticsCard(title: "Weekly Progress", icon: "chart.bar.fill") {
                        WeeklyProgressChart(sessions: getWeeklyData())
                    }
                    
                    HStack(spacing: 20) {
                        // Session Type Distribution
                        AnalyticsCard(title: "Session Distribution", icon: "chart.pie.fill") {
                            SessionDistributionChart(data: getSessionTypeData())
                        }
                        
                        // Daily Patterns
                        AnalyticsCard(title: "Daily Patterns", icon: "clock.fill") {
                            DailyPatternsChart(data: getDailyPatterns())
                        }
                    }
                }
                
                // Recent Sessions
                AnalyticsCard(title: "Recent Sessions", icon: "list.bullet") {
                    RecentSessionsList(sessions: getRecentSessions())
                }
            }
            .padding(30)
        }
    }
    
    // MARK: - Data Methods
    
    private func getStats() -> AnalyticsStats {
        let sessions = getFilteredSessions()
        let completedSessions = sessions.filter { $0.completed }
        let focusSessions = completedSessions.filter { $0.sessionType == .focus }
        
        let totalFocusTime = focusSessions.reduce(0) { $0 + $1.duration }
        let completionRate = sessions.isEmpty ? 0.0 : Double(completedSessions.count) / Double(sessions.count) * 100
        
        return AnalyticsStats(
            totalSessions: sessions.count,
            totalFocusTime: totalFocusTime,
            completionRate: completionRate,
            currentStreak: timerManager.getTodaysStats().streak
        )
    }
    
    private func getFilteredSessions() -> [SessionData] {
        let calendar = Calendar.current
        let now = Date()
        
        switch selectedTimeRange {
        case .week:
            let weekAgo = calendar.date(byAdding: .day, value: -7, to: now) ?? now
            return timerManager.sessionHistory.filter { $0.date >= weekAgo }
        case .month:
            let monthAgo = calendar.date(byAdding: .month, value: -1, to: now) ?? now
            return timerManager.sessionHistory.filter { $0.date >= monthAgo }
        case .year:
            let yearAgo = calendar.date(byAdding: .year, value: -1, to: now) ?? now
            return timerManager.sessionHistory.filter { $0.date >= yearAgo }
        }
    }
    
    private func getWeeklyData() -> [WeeklySessionData] {
        let calendar = Calendar.current
        let now = Date()
        var weeklyData: [WeeklySessionData] = []
        
        for i in 0..<7 {
            let date = calendar.date(byAdding: .day, value: -i, to: now) ?? now
            let dayStart = calendar.startOfDay(for: date)
            let dayEnd = calendar.date(byAdding: .day, value: 1, to: dayStart) ?? dayStart
            
            let daySessions = timerManager.sessionHistory.filter { session in
                session.date >= dayStart && session.date < dayEnd && session.completed
            }
            
            let focusTime = daySessions
                .filter { $0.sessionType == .focus }
                .reduce(0) { $0 + $1.duration }
            
            weeklyData.append(WeeklySessionData(
                date: date,
                sessions: daySessions.count,
                focusTime: focusTime
            ))
        }
        
        return weeklyData.reversed()
    }
    
    private func getSessionTypeData() -> [SessionTypeData] {
        let sessions = getFilteredSessions().filter { $0.completed }
        let focusSessions = sessions.filter { $0.sessionType == .focus }.count
        let breakSessions = sessions.filter { $0.sessionType == .shortBreak }.count
        let longBreakSessions = sessions.filter { $0.sessionType == .longBreak }.count
        
        return [
            SessionTypeData(type: .focus, count: focusSessions),
            SessionTypeData(type: .shortBreak, count: breakSessions),
            SessionTypeData(type: .longBreak, count: longBreakSessions)
        ]
    }
    
    private func getDailyPatterns() -> [HourlySessionData] {
        let sessions = getFilteredSessions().filter { $0.completed }
        var hourlyData: [HourlySessionData] = []
        
        for hour in 0...23 {
            let hourSessions = sessions.filter { session in
                Calendar.current.component(.hour, from: session.date) == hour
            }
            
            hourlyData.append(HourlySessionData(
                hour: hour,
                sessions: hourSessions.count
            ))
        }
        
        return hourlyData
    }
    
    private func getRecentSessions() -> [SessionData] {
        return Array(timerManager.sessionHistory.suffix(10).reversed())
    }
    
    private func formatFocusTime(_ minutes: Int) -> String {
        let hours = minutes / 60
        let mins = minutes % 60
        return hours > 0 ? "\(hours)h \(mins)m" : "\(mins)m"
    }
}

// MARK: - Charts

struct WeeklyProgressChart: View {
    let sessions: [WeeklySessionData]
    
    var body: some View {
        Chart(sessions) { session in
            BarMark(
                x: .value("Day", session.date, unit: .day),
                y: .value("Focus Time", session.focusTime)
            )
            .foregroundStyle(
                LinearGradient(
                    colors: [.cyan, .purple],
                    startPoint: .bottom,
                    endPoint: .top
                )
            )
        }
        .frame(height: 200)
        .chartXAxis {
            AxisMarks(values: .stride(by: .day)) { value in
                AxisGridLine()
                AxisValueLabel(format: .dateTime.weekday(.abbreviated))
            }
        }
    }
}

struct SessionDistributionChart: View {
    let data: [SessionTypeData]
    
    var body: some View {
        Chart(data) { item in
            SectorMark(
                angle: .value("Sessions", item.count),
                innerRadius: .ratio(0.4),
                angularInset: 2
            )
            .foregroundStyle(getColorForSessionType(item.type))
        }
        .frame(height: 200)
    }
    
    private func getColorForSessionType(_ type: SessionType) -> Color {
        switch type {
        case .focus:
            return .cyan
        case .shortBreak:
            return .green
        case .longBreak:
            return .purple
        }
    }
}

struct DailyPatternsChart: View {
    let data: [HourlySessionData]
    
    var body: some View {
        Chart(data) { item in
            LineMark(
                x: .value("Hour", item.hour),
                y: .value("Sessions", item.sessions)
            )
            .foregroundStyle(.pink)
            .lineStyle(StrokeStyle(lineWidth: 2))
        }
        .frame(height: 200)
        .chartXAxis {
            AxisMarks(values: Array(stride(from: 0, through: 23, by: 4))) { value in
                AxisGridLine()
                AxisValueLabel()
            }
        }
    }
}

// MARK: - Supporting Views

struct StatsCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
            
            Text(value)
                .font(.custom("Orbitron", size: 20))
                .fontWeight(.bold)
                .foregroundColor(.white)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(16)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.black.opacity(0.3))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(color.opacity(0.5), lineWidth: 1)
                )
        )
    }
}

struct AnalyticsCard<Content: View>: View {
    let title: String
    let icon: String
    @ViewBuilder let content: () -> Content
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(.cyan)
                
                Text(title)
                    .font(.headline)
                    .foregroundColor(.white)
            }
            
            content()
        }
        .padding(20)
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

struct RecentSessionsList: View {
    let sessions: [SessionData]
    
    var body: some View {
        VStack(spacing: 8) {
            ForEach(sessions) { session in
                HStack {
                    Image(systemName: getIconForSessionType(session.sessionType))
                        .foregroundColor(getColorForSessionType(session.sessionType))
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text(session.sessionType.displayName)
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                        
                        if let intention = session.intention {
                            Text(intention)
                                .font(.caption2)
                                .foregroundColor(.secondary)
                                .lineLimit(1)
                        }
                    }
                    
                    Spacer()
                    
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("\(session.duration)m")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                        
                        Image(systemName: session.completed ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .font(.caption2)
                            .foregroundColor(session.completed ? .green : .red)
                    }
                }
                .padding(.vertical, 4)
                
                if session.id != sessions.last?.id {
                    Divider()
                        .background(Color.gray.opacity(0.3))
                }
            }
        }
    }
    
    private func getIconForSessionType(_ type: SessionType) -> String {
        switch type {
        case .focus:
            return "brain.head.profile"
        case .shortBreak:
            return "cup.and.saucer.fill"
        case .longBreak:
            return "bed.double.fill"
        }
    }
    
    private func getColorForSessionType(_ type: SessionType) -> Color {
        switch type {
        case .focus:
            return .cyan
        case .shortBreak:
            return .green
        case .longBreak:
            return .purple
        }
    }
}

// MARK: - Data Models

struct AnalyticsStats {
    let totalSessions: Int
    let totalFocusTime: Int
    let completionRate: Double
    let currentStreak: Int
}

struct WeeklySessionData: Identifiable {
    let id = UUID()
    let date: Date
    let sessions: Int
    let focusTime: Int
}

struct SessionTypeData: Identifiable {
    let id = UUID()
    let type: SessionType
    let count: Int
}

struct HourlySessionData: Identifiable {
    let id = UUID()
    let hour: Int
    let sessions: Int
}

#Preview {
    AnalyticsView()
        .environmentObject(TimerManager())
        .frame(width: 1000, height: 700)
}