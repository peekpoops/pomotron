import SwiftUI
import UserNotifications

@main
struct PomotronMacApp: App {
    @StateObject private var timerManager = TimerManager()
    @StateObject private var websiteBlocker = WebsiteBlocker()
    @StateObject private var soundManager = SoundManager()
    
    init() {
        // Request notification permissions
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(timerManager)
                .environmentObject(websiteBlocker)
                .environmentObject(soundManager)
                .frame(minWidth: 1000, minHeight: 700)
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentSize)
    }
}