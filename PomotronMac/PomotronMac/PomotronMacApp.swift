import SwiftUI
import UserNotifications

@main
struct PomotronMacApp: App {
    @StateObject private var timerManager = TimerManager()
    @StateObject private var websiteBlocker = WebsiteBlocker()
    @StateObject private var soundManager = SoundManager()
    @StateObject private var fontManager = FontManager.shared
    
    init() {
        // Request notification permissions
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
        
        // Initialize font manager
        _ = FontManager.shared
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(timerManager)
                .environmentObject(websiteBlocker)
                .environmentObject(soundManager)
                .frame(minWidth: 768, idealWidth: 768, maxWidth: 768, minHeight: 1200, idealHeight: 1200, maxHeight: 1200)
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentSize)
    }
}