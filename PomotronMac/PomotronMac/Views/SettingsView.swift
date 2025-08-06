import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var timerManager: TimerManager
    @EnvironmentObject var websiteBlocker: WebsiteBlocker
    @EnvironmentObject var soundManager: SoundManager
    @State private var newWebsite = ""
    @State private var showingExportSheet = false
    
    var body: some View {
        VStack(spacing: 32) {
            // Header
            Text("SETTINGS")
                .font(.pomotronTitle())
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
                    // Timer Settings
                    SettingsSection(title: "Timer Settings") {
                        VStack(spacing: 20) {
                            SettingSlider(
                                title: "Focus Duration",
                                value: Binding(
                                    get: { Double(timerManager.settings.focusDuration) },
                                    set: { timerManager.settings.focusDuration = Int($0) }
                                ),
                                range: 15...60,
                                step: 5,
                                unit: "minutes",
                                color: Color(red: 0.263, green: 0.824, blue: 0.824)
                            )
                            
                            SettingSlider(
                                title: "Short Break",
                                value: Binding(
                                    get: { Double(timerManager.settings.shortBreakDuration) },
                                    set: { timerManager.settings.shortBreakDuration = Int($0) }
                                ),
                                range: 3...15,
                                step: 1,
                                unit: "minutes",
                                color: Color(red: 0.945, green: 0.431, blue: 0.765)
                            )
                            
                            SettingSlider(
                                title: "Long Break",
                                value: Binding(
                                    get: { Double(timerManager.settings.longBreakDuration) },
                                    set: { timerManager.settings.longBreakDuration = Int($0) }
                                ),
                                range: 15...45,
                                step: 5,
                                unit: "minutes",
                                color: Color(red: 0.647, green: 0.329, blue: 0.808)
                            )
                            
                            SettingSlider(
                                title: "Sessions until Long Break",
                                value: Binding(
                                    get: { Double(timerManager.settings.sessionsUntilLongBreak) },
                                    set: { timerManager.settings.sessionsUntilLongBreak = Int($0) }
                                ),
                                range: 2...8,
                                step: 1,
                                unit: "sessions",
                                color: Color(red: 0.498, green: 0.831, blue: 0.275)
                            )
                        }
                    }
                    
                    // Behavior Settings
                    SettingsSection(title: "Behavior") {
                        VStack(spacing: 16) {
                            ToggleSetting(
                                title: "Auto-start Breaks",
                                subtitle: "Automatically start break sessions",
                                isOn: $timerManager.settings.autoStartBreaks,
                                color: Color(red: 0.263, green: 0.824, blue: 0.824)
                            )
                            
                            ToggleSetting(
                                title: "Auto-start Focus",
                                subtitle: "Automatically start focus sessions after breaks",
                                isOn: $timerManager.settings.autoStartFocus,
                                color: Color(red: 0.945, green: 0.431, blue: 0.765)
                            )
                            
                            ToggleSetting(
                                title: "Website Blocking",
                                subtitle: "Block distracting websites during focus",
                                isOn: $timerManager.settings.websiteBlockingEnabled,
                                color: Color(red: 0.647, green: 0.329, blue: 0.808)
                            )
                        }
                    }
                    
                    // Sound Settings
                    SettingsSection(title: "Audio") {
                        VStack(spacing: 16) {
                            ToggleSetting(
                                title: "Sound Effects",
                                subtitle: "Enable retro sound effects",
                                isOn: $soundManager.soundEnabled,
                                color: Color(red: 0.263, green: 0.824, blue: 0.824)
                            )
                            
                            if soundManager.soundEnabled {
                                SettingSlider(
                                    title: "Volume",
                                    value: Binding(
                                        get: { Double(soundManager.volume) },
                                        set: { soundManager.setVolume(Float($0)) }
                                    ),
                                    range: 0...1,
                                    step: 0.1,
                                    unit: "",
                                    color: Color(red: 0.945, green: 0.431, blue: 0.765)
                                )
                            }
                        }
                    }
                    
                    // Website Blocking
                    if timerManager.settings.websiteBlockingEnabled {
                        SettingsSection(title: "Website Blocking") {
                            VStack(spacing: 20) {
                                // Add new website
                                HStack(spacing: 12) {
                                    TextField("Enter website (e.g., reddit.com)", text: $newWebsite)
                                        .font(.system(size: 14, weight: .medium))
                                        .foregroundColor(.white)
                                        .padding(12)
                                        .background(
                                            RoundedRectangle(cornerRadius: 8)
                                                .fill(Color.black.opacity(0.4))
                                                .overlay(
                                                    RoundedRectangle(cornerRadius: 8)
                                                        .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                                                )
                                        )
                                        .textFieldStyle(PlainTextFieldStyle())
                                    
                                    Button("Add") {
                                        if !newWebsite.isEmpty {
                                            websiteBlocker.addWebsite(newWebsite)
                                            newWebsite = ""
                                        }
                                    }
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(
                                        RoundedRectangle(cornerRadius: 8)
                                            .fill(Color(red: 0.263, green: 0.824, blue: 0.824).opacity(0.2))
                                            .overlay(
                                                RoundedRectangle(cornerRadius: 8)
                                                    .stroke(Color(red: 0.263, green: 0.824, blue: 0.824), lineWidth: 1)
                                            )
                                    )
                                }
                                
                                // Website list
                                LazyVStack(spacing: 8) {
                                    ForEach(websiteBlocker.blockedWebsites, id: \.self) { website in
                                        HStack {
                                            Text(website)
                                                .font(.system(size: 14, weight: .medium))
                                                .foregroundColor(.white)
                                            
                                            Spacer()
                                            
                                            Button("Remove") {
                                                websiteBlocker.removeWebsite(website)
                                            }
                                            .font(.system(size: 12, weight: .medium))
                                            .foregroundColor(Color(red: 0.937, green: 0.373, blue: 0.373))
                                        }
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 8)
                                        .background(
                                            RoundedRectangle(cornerRadius: 6)
                                                .fill(Color.gray.opacity(0.1))
                                        )
                                    }
                                }
                            }
                        }
                    }
                    
                    // Data Management
                    SettingsSection(title: "Data") {
                        VStack(spacing: 16) {
                            Button("Export Session Data") {
                                showingExportSheet = true
                            }
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color(red: 0.263, green: 0.824, blue: 0.824).opacity(0.2))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12)
                                            .stroke(Color(red: 0.263, green: 0.824, blue: 0.824), lineWidth: 2)
                                    )
                            )
                            
                            Button("Clear All Data") {
                                timerManager.clearAllData()
                            }
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.white)
                            .padding()
                            .frame(maxWidth: .infinity)
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color(red: 0.937, green: 0.373, blue: 0.373).opacity(0.2))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12)
                                            .stroke(Color(red: 0.937, green: 0.373, blue: 0.373), lineWidth: 2)
                                    )
                            )
                        }
                    }
                }
            }
        }
        .padding(.horizontal, 24)
        .fileExporter(
            isPresented: $showingExportSheet,
            document: SessionDataDocument(sessions: timerManager.sessionHistory),
            contentType: .json,
            defaultFilename: "pomotron-sessions"
        ) { result in
            // Handle export result if needed
        }
    }
}

struct SettingsSection<Content: View>: View {
    let title: String
    let content: Content
    
    init(title: String, @ViewBuilder content: () -> Content) {
        self.title = title
        self.content = content()
    }
    
    var body: some View {
        VStack(spacing: 20) {
            HStack {
                Text(title)
                    .font(.pomotronHeading())
                    .foregroundColor(.white)
                
                Spacer()
            }
            
            content
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

struct SettingSlider: View {
    let title: String
    @Binding var value: Double
    let range: ClosedRange<Double>
    let step: Double
    let unit: String
    let color: Color
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(title)
                    .font(.pomotronBody(size: 16))
                    .foregroundColor(.white)
                
                Spacer()
                
                Text("\(Int(value)) \(unit)")
                    .font(.pomotronBody(size: 14))
                    .foregroundColor(color)
            }
            
            Slider(value: $value, in: range, step: step)
                .accentColor(color)
        }
    }
}

struct ToggleSetting: View {
    let title: String
    let subtitle: String
    @Binding var isOn: Bool
    let color: Color
    
    var body: some View {
        HStack(spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.pomotronBody(size: 16))
                    .foregroundColor(.white)
                
                Text(subtitle)
                    .font(.pomotronBody(size: 14))
                    .foregroundColor(.gray)
            }
            
            Spacer()
            
            Toggle("", isOn: $isOn)
                .toggleStyle(SwitchToggleStyle(tint: color))
        }
    }
}

struct SessionDataDocument: FileDocument {
    static var readableContentTypes: [UTType] { [.json] }
    
    let sessions: [PomodoroSession]
    
    init(sessions: [PomodoroSession]) {
        self.sessions = sessions
    }
    
    init(configuration: ReadConfiguration) throws {
        self.sessions = []
    }
    
    func fileWrapper(configuration: WriteConfiguration) throws -> FileWrapper {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = .prettyPrinted
        
        let data = try encoder.encode(sessions)
        return FileWrapper(regularFileWithContents: data)
    }
}

#Preview {
    SettingsView()
        .environmentObject(TimerManager())
        .environmentObject(WebsiteBlocker())
        .environmentObject(SoundManager())
        .frame(width: 768, height: 1200)
        .background(Color.black)
}