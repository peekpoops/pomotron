import Foundation

// MARK: - Pomodoro Timer States
enum TimerState {
    case idle
    case focus
    case shortBreak
    case longBreak
    case paused
}

// MARK: - Session Data Models
struct PomodoroSession: Identifiable, Codable {
    let id = UUID()
    let startTime: Date
    let endTime: Date
    let type: SessionType
    let task: String?
    let motivation: String?
    let completed: Bool
    
    var duration: TimeInterval {
        endTime.timeIntervalSince(startTime)
    }
}

enum SessionType: String, Codable, CaseIterable {
    case focus = "focus"
    case shortBreak = "shortBreak"
    case longBreak = "longBreak"
    
    var displayName: String {
        switch self {
        case .focus: return "Focus"
        case .shortBreak: return "Short Break"
        case .longBreak: return "Long Break"
        }
    }
}

// MARK: - Settings Model
struct TimerSettings: Codable {
    var focusDuration: Double = 25 * 60  // 25 minutes
    var shortBreakDuration: Double = 5 * 60  // 5 minutes
    var longBreakDuration: Double = 15 * 60  // 15 minutes
    var sessionsUntilLongBreak: Int = 4
    var autoStartBreaks: Bool = false
    var autoStartFocus: Bool = false
    var soundEnabled: Bool = true
    var notificationsEnabled: Bool = true
}

// MARK: - Analytics Models
struct WeeklyStats: Identifiable {
    let id = UUID()
    let week: String
    let focusTime: TimeInterval
    let sessionsCompleted: Int
    let completionRate: Double
}

struct DayStats {
    let date: Date
    let focusTime: TimeInterval
    let sessionsCompleted: Int
    
    var dayName: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "EEE"
        return formatter.string(from: date)
    }
}

// MARK: - Website Blocking
struct BlockedWebsite: Identifiable, Codable {
    let id = UUID()
    let url: String
    let isActive: Bool
    
    init(url: String, isActive: Bool = true) {
        self.url = url
        self.isActive = isActive
    }
}