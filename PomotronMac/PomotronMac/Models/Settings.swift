import Foundation

struct PomotronSettings: Codable, ObservableObject {
    var focusDuration: Int = 25
    var breakDuration: Int = 5
    var longBreakDuration: Int = 15
    var cyclesBeforeLongBreak: Int = 4
    var autoStart: Bool = false
    var softStart: Bool = false
    var idleTimeout: Int = 5
    var websiteBlockingEnabled: Bool = true
    var frictionOverride: Bool = false
    var blockedSites: [String] = [
        "facebook.com",
        "twitter.com", 
        "reddit.com",
        "youtube.com",
        "instagram.com",
        "tiktok.com",
        "netflix.com"
    ]
    
    static let shared = PomotronSettings()
    
    private let userDefaults = UserDefaults.standard
    private let settingsKey = "PomotronSettings"
    
    init() {
        loadSettings()
    }
    
    func saveSettings() {
        if let encoded = try? JSONEncoder().encode(self) {
            userDefaults.set(encoded, forKey: settingsKey)
        }
    }
    
    private func loadSettings() {
        guard let data = userDefaults.data(forKey: settingsKey),
              let decoded = try? JSONDecoder().decode(PomotronSettings.self, from: data) else {
            return
        }
        
        self.focusDuration = decoded.focusDuration
        self.breakDuration = decoded.breakDuration
        self.longBreakDuration = decoded.longBreakDuration
        self.cyclesBeforeLongBreak = decoded.cyclesBeforeLongBreak
        self.autoStart = decoded.autoStart
        self.softStart = decoded.softStart
        self.idleTimeout = decoded.idleTimeout
        self.websiteBlockingEnabled = decoded.websiteBlockingEnabled
        self.frictionOverride = decoded.frictionOverride
        self.blockedSites = decoded.blockedSites
    }
}

struct SessionData: Codable, Identifiable {
    let id = UUID()
    let date: Date
    let sessionType: SessionType
    let duration: Int
    let completed: Bool
    let intention: String?
    let motivation: String?
}

enum SessionType: String, Codable, CaseIterable {
    case focus = "focus"
    case shortBreak = "break"
    case longBreak = "longBreak"
    
    var displayName: String {
        switch self {
        case .focus:
            return "Focus Time"
        case .shortBreak:
            return "Break Time"
        case .longBreak:
            return "Long Break"
        }
    }
    
    var color: String {
        switch self {
        case .focus:
            return "cyan"
        case .shortBreak:
            return "green"
        case .longBreak:
            return "purple"
        }
    }
}

struct TimerState {
    var isRunning: Bool = false
    var isPaused: Bool = false
    var timeLeft: Int = 0
    var sessionType: SessionType = .focus
    var currentCycle: Int = 1
    var currentIntention: (task: String, why: String) = ("", "")
    var startTime: Date?
}