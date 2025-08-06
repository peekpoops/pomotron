import Foundation
import SwiftUI

class PomotronSettings: ObservableObject, Codable {
    @Published var focusDuration: Int = 25
    @Published var breakDuration: Int = 5
    @Published var longBreakDuration: Int = 15
    @Published var cyclesBeforeLongBreak: Int = 4
    @Published var autoStart: Bool = false
    @Published var softStart: Bool = false
    @Published var idleTimeout: Int = 5
    @Published var websiteBlockingEnabled: Bool = true
    @Published var frictionOverride: Bool = false
    @Published var blockedSites: [String] = [
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
    
    private enum CodingKeys: String, CodingKey {
        case focusDuration, breakDuration, longBreakDuration, cyclesBeforeLongBreak
        case autoStart, softStart, idleTimeout, websiteBlockingEnabled, frictionOverride, blockedSites
    }
    
    init() {
        loadSettings()
    }
    
    required init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        focusDuration = try container.decodeIfPresent(Int.self, forKey: .focusDuration) ?? 25
        breakDuration = try container.decodeIfPresent(Int.self, forKey: .breakDuration) ?? 5
        longBreakDuration = try container.decodeIfPresent(Int.self, forKey: .longBreakDuration) ?? 15
        cyclesBeforeLongBreak = try container.decodeIfPresent(Int.self, forKey: .cyclesBeforeLongBreak) ?? 4
        autoStart = try container.decodeIfPresent(Bool.self, forKey: .autoStart) ?? false
        softStart = try container.decodeIfPresent(Bool.self, forKey: .softStart) ?? false
        idleTimeout = try container.decodeIfPresent(Int.self, forKey: .idleTimeout) ?? 5
        websiteBlockingEnabled = try container.decodeIfPresent(Bool.self, forKey: .websiteBlockingEnabled) ?? true
        frictionOverride = try container.decodeIfPresent(Bool.self, forKey: .frictionOverride) ?? false
        blockedSites = try container.decodeIfPresent([String].self, forKey: .blockedSites) ?? [
            "facebook.com", "twitter.com", "reddit.com", "youtube.com", "instagram.com", "tiktok.com", "netflix.com"
        ]
        
        loadSettings()
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        
        try container.encode(focusDuration, forKey: .focusDuration)
        try container.encode(breakDuration, forKey: .breakDuration)
        try container.encode(longBreakDuration, forKey: .longBreakDuration)
        try container.encode(cyclesBeforeLongBreak, forKey: .cyclesBeforeLongBreak)
        try container.encode(autoStart, forKey: .autoStart)
        try container.encode(softStart, forKey: .softStart)
        try container.encode(idleTimeout, forKey: .idleTimeout)
        try container.encode(websiteBlockingEnabled, forKey: .websiteBlockingEnabled)
        try container.encode(frictionOverride, forKey: .frictionOverride)
        try container.encode(blockedSites, forKey: .blockedSites)
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