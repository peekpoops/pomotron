import Foundation
import SwiftUI
import UserNotifications
import Combine

class TimerManager: ObservableObject {
    @Published var timerState = TimerState()
    @ObservedObject var settings = PomotronSettings.shared
    @Published var sessionHistory: [SessionData] = []
    
    private var timer: Timer?
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        loadSessionHistory()
        setupTimer()
    }
    
    func startSession(intention: (task: String, why: String)? = nil) {
        print("TimerManager.startSession called with intention: \(intention?.task ?? "none")")
        
        if let intention = intention {
            timerState.currentIntention = intention
        }
        
        timerState.isRunning = true
        timerState.isPaused = false
        timerState.startTime = Date()
        
        let duration = getDurationForCurrentSession()
        timerState.timeLeft = duration * 60
        
        print("Timer started: \(duration) minutes (\(duration * 60) seconds)")
        
        scheduleNotification()
        startTimer()
    }
    
    func pauseSession() {
        timerState.isRunning = false
        timerState.isPaused = true
        timer?.invalidate()
    }
    
    func resumeSession() {
        timerState.isRunning = true
        timerState.isPaused = false
        startTimer()
    }
    
    func resetSession() {
        timer?.invalidate()
        timerState.isRunning = false
        timerState.isPaused = false
        
        let duration = getDurationForCurrentSession()
        timerState.timeLeft = duration * 60
    }
    
    func endSession() {
        timer?.invalidate()
        
        // Save session data
        if timerState.startTime != nil {
            let sessionData = SessionData(
                date: Date(),
                sessionType: timerState.sessionType,
                duration: getDurationForCurrentSession(),
                completed: false,
                intention: timerState.currentIntention.task.isEmpty ? nil : timerState.currentIntention.task,
                motivation: timerState.currentIntention.why.isEmpty ? nil : timerState.currentIntention.why
            )
            sessionHistory.append(sessionData)
            saveSessionHistory()
        }
        
        timerState.isRunning = false
        timerState.isPaused = false
        timerState.currentIntention = ("", "")
        
        let duration = getDurationForCurrentSession()
        timerState.timeLeft = duration * 60
    }
    
    private func startTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            if self.timerState.timeLeft > 0 {
                self.timerState.timeLeft -= 1
            } else {
                self.sessionCompleted()
            }
        }
    }
    
    private func sessionCompleted() {
        timer?.invalidate()
        
        // Save completed session
        let sessionData = SessionData(
            date: Date(),
            sessionType: timerState.sessionType,
            duration: getDurationForCurrentSession(),
            completed: true,
            intention: timerState.currentIntention.task.isEmpty ? nil : timerState.currentIntention.task,
            motivation: timerState.currentIntention.why.isEmpty ? nil : timerState.currentIntention.why
        )
        sessionHistory.append(sessionData)
        saveSessionHistory()
        
        // Move to next session
        if timerState.sessionType == .focus {
            if timerState.currentCycle % settings.cyclesBeforeLongBreak == 0 {
                timerState.sessionType = .longBreak
            } else {
                timerState.sessionType = .shortBreak
            }
        } else {
            timerState.sessionType = .focus
            if timerState.sessionType == .focus {
                timerState.currentCycle += 1
            }
        }
        
        timerState.isRunning = false
        timerState.isPaused = false
        timerState.currentIntention = ("", "")
        
        let duration = getDurationForCurrentSession()
        timerState.timeLeft = duration * 60
        
        // Auto-start next session if enabled
        if settings.autoStart {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
                self.startSession()
            }
        }
    }
    
    private func getDurationForCurrentSession() -> Int {
        switch timerState.sessionType {
        case .focus:
            return settings.focusDuration
        case .shortBreak:
            return settings.breakDuration
        case .longBreak:
            return settings.longBreakDuration
        }
    }
    
    private func setupTimer() {
        let duration = getDurationForCurrentSession()
        timerState.timeLeft = duration * 60
    }
    
    private func scheduleNotification() {
        let content = UNMutableNotificationContent()
        content.title = "Pomotron"
        content.body = "\(timerState.sessionType.displayName) completed!"
        content.sound = .default
        
        let trigger = UNTimeIntervalNotificationTrigger(
            timeInterval: TimeInterval(timerState.timeLeft),
            repeats: false
        )
        
        let request = UNNotificationRequest(
            identifier: UUID().uuidString,
            content: content,
            trigger: trigger
        )
        
        UNUserNotificationCenter.current().add(request)
    }
    
    // MARK: - Session History
    
    private func saveSessionHistory() {
        if let encoded = try? JSONEncoder().encode(sessionHistory) {
            UserDefaults.standard.set(encoded, forKey: "SessionHistory")
        }
    }
    
    private func loadSessionHistory() {
        guard let data = UserDefaults.standard.data(forKey: "SessionHistory"),
              let decoded = try? JSONDecoder().decode([SessionData].self, from: data) else {
            return
        }
        sessionHistory = decoded
    }
    
    // MARK: - Helper Methods
    
    func formatTime(_ seconds: Int) -> String {
        let minutes = seconds / 60
        let remainingSeconds = seconds % 60
        return String(format: "%02d:%02d", minutes, remainingSeconds)
    }
    
    func getProgress() -> Double {
        let totalDuration = getDurationForCurrentSession() * 60
        let elapsed = totalDuration - timerState.timeLeft
        return Double(elapsed) / Double(totalDuration) * 100
    }
    
    func getTodaysStats() -> (sessions: Int, focusTime: Int, streak: Int) {
        let today = Calendar.current.startOfDay(for: Date())
        let todaySessions = sessionHistory.filter { session in
            Calendar.current.isDate(session.date, inSameDayAs: today) && session.completed
        }
        
        let focusTime = todaySessions
            .filter { $0.sessionType == .focus }
            .reduce(0) { $0 + $1.duration }
        
        return (
            sessions: todaySessions.count,
            focusTime: focusTime,
            streak: calculateStreak()
        )
    }
    
    private func calculateStreak() -> Int {
        // Simple streak calculation - count consecutive days with completed sessions
        let calendar = Calendar.current
        var streak = 0
        var currentDate = Date()
        
        while true {
            let dayStart = calendar.startOfDay(for: currentDate)
            let hasSessions = sessionHistory.contains { session in
                calendar.isDate(session.date, inSameDayAs: dayStart) && session.completed
            }
            
            if hasSessions {
                streak += 1
                currentDate = calendar.date(byAdding: .day, value: -1, to: currentDate) ?? currentDate
            } else {
                break
            }
        }
        
        return streak
    }
}