import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var websiteBlocker: WebsiteBlocker
    @EnvironmentObject var soundManager: SoundManager
    @StateObject private var settings = PomotronSettings.shared
    @State private var newSite = ""
    @State private var showingPermissionAlert = false
    
    var body: some View {
        ScrollView {
            VStack(spacing: 30) {
                // Header
                VStack(spacing: 8) {
                    Text("SETTINGS & CONFIGURATION")
                        .font(.custom("Orbitron", size: 28))
                        .fontWeight(.black)
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.pink, .purple, .cyan],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                    
                    Text("Customize your Pomotron experience")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 30) {
                    
                    // Timer Configuration
                    SettingsCard(title: "Timer Configuration", icon: "timer") {
                        TimerConfigurationSection(settings: settings)
                    }
                    
                    // Website Blocker
                    SettingsCard(title: "Website Blocker", icon: "shield.fill") {
                        WebsiteBlockerSection(
                            settings: settings,
                            websiteBlocker: websiteBlocker,
                            newSite: $newSite,
                            showingPermissionAlert: $showingPermissionAlert
                        )
                    }
                    
                    // Sound Settings
                    SettingsCard(title: "Sound Settings", icon: "speaker.wave.2.fill") {
                        SoundSettingsSection(soundManager: soundManager)
                    }
                    
                    // Keyboard Shortcuts
                    SettingsCard(title: "Keyboard Shortcuts", icon: "keyboard") {
                        KeyboardShortcutsSection()
                    }
                }
                
                // Save Button
                Button("Save Settings") {
                    settings.saveSettings()
                    showSuccessMessage()
                }
                .buttonStyle(PrimaryRetroButtonStyle())
                .padding(.top, 20)
            }
            .padding(30)
        }
        .alert("Permission Required", isPresented: $showingPermissionAlert) {
            Button("Open System Preferences") {
                NSWorkspace.shared.open(URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")!)
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("Pomotron needs accessibility permissions to block websites effectively. Please grant access in System Preferences.")
        }
    }
    
    private func showSuccessMessage() {
        // You could implement a toast or notification here
        print("Settings saved successfully!")
    }
}

// MARK: - Settings Sections

struct TimerConfigurationSection: View {
    @ObservedObject var settings: PomotronSettings
    
    var body: some View {
        VStack(spacing: 16) {
            // Duration Settings
            HStack(spacing: 12) {
                SettingsNumberField(
                    title: "Focus (min)",
                    value: $settings.focusDuration,
                    range: 1...120
                )
                
                SettingsNumberField(
                    title: "Break (min)",
                    value: $settings.breakDuration,
                    range: 1...60
                )
                
                SettingsNumberField(
                    title: "Long Break (min)",
                    value: $settings.longBreakDuration,
                    range: 1...120
                )
            }
            
            SettingsNumberField(
                title: "Cycles before long break",
                value: $settings.cyclesBeforeLongBreak,
                range: 1...10
            )
            
            SettingsNumberField(
                title: "Idle timeout (min)",
                value: $settings.idleTimeout,
                range: 1...60
            )
            
            Divider()
                .background(Color.cyan.opacity(0.3))
            
            // Toggle Settings
            SettingsToggle(
                title: "Auto-start next session",
                isOn: $settings.autoStart
            )
            
            SettingsToggle(
                title: "Soft start (5s countdown)",
                isOn: $settings.softStart
            )
        }
    }
}

struct WebsiteBlockerSection: View {
    @ObservedObject var settings: PomotronSettings
    @ObservedObject var websiteBlocker: WebsiteBlocker
    @Binding var newSite: String
    @Binding var showingPermissionAlert: Bool
    
    var body: some View {
        VStack(spacing: 16) {
            // Permission Status
            HStack {
                Image(systemName: websiteBlocker.permissionGranted ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                    .foregroundColor(websiteBlocker.permissionGranted ? .green : .orange)
                
                Text(websiteBlocker.permissionGranted ? "Permissions Granted" : "Permissions Required")
                    .font(.caption)
                    .foregroundColor(websiteBlocker.permissionGranted ? .green : .orange)
                
                Spacer()
                
                if !websiteBlocker.permissionGranted {
                    Button("Grant") {
                        showingPermissionAlert = true
                    }
                    .font(.caption2)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.orange.opacity(0.2))
                    .foregroundColor(.orange)
                    .cornerRadius(4)
                }
            }
            
            SettingsToggle(
                title: "Enable website blocking",
                isOn: $settings.websiteBlockingEnabled
            )
            
            SettingsToggle(
                title: "Friction-based override",
                isOn: $settings.frictionOverride
            )
            
            Divider()
                .background(Color.cyan.opacity(0.3))
            
            // Blocked Sites Management
            VStack(alignment: .leading, spacing: 8) {
                Text("Blocked Websites")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                
                // Site List
                ScrollView {
                    LazyVStack(spacing: 4) {
                        ForEach(settings.blockedSites, id: \.self) { site in
                            HStack {
                                Text(site)
                                    .font(.caption2)
                                    .foregroundColor(.secondary)
                                
                                Spacer()
                                
                                Button {
                                    websiteBlocker.removeBlockedSite(site)
                                } label: {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundColor(.red)
                                        .font(.caption)
                                }
                                .buttonStyle(PlainButtonStyle())
                            }
                            .padding(.vertical, 2)
                        }
                    }
                }
                .frame(maxHeight: 80)
                
                // Add Site Field
                HStack(spacing: 8) {
                    TextField("Add website...", text: $newSite)
                        .textFieldStyle(CompactRetroTextFieldStyle())
                        .onSubmit {
                            addSite()
                        }
                    
                    Button {
                        addSite()
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .foregroundColor(.cyan)
                    }
                    .buttonStyle(PlainButtonStyle())
                }
            }
        }
    }
    
    private func addSite() {
        guard !newSite.isEmpty else { return }
        websiteBlocker.addBlockedSite(newSite)
        newSite = ""
    }
}

struct SoundSettingsSection: View {
    @ObservedObject var soundManager: SoundManager
    
    var body: some View {
        VStack(spacing: 16) {
            SettingsToggle(
                title: "Mute sounds",
                isOn: $soundManager.isMuted
            )
            
            VStack(alignment: .leading, spacing: 8) {
                Text("Volume")
                    .font(.caption)
                    .fontWeight(.semibold)
                    .foregroundColor(.white)
                
                HStack {
                    Image(systemName: "speaker.fill")
                        .font(.caption2)
                        .foregroundColor(.cyan)
                    
                    Slider(value: Binding(
                        get: { soundManager.volume },
                        set: { soundManager.setVolume($0) }
                    ), in: 0...1)
                    .accentColor(.cyan)
                    
                    Image(systemName: "speaker.wave.2.fill")
                        .font(.caption2)
                        .foregroundColor(.cyan)
                }
            }
            
            // Test Sounds
            HStack(spacing: 8) {
                Button("Test Start") {
                    soundManager.playStartSound()
                }
                .font(.caption2)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.green.opacity(0.2))
                .foregroundColor(.green)
                .cornerRadius(4)
                
                Button("Test Complete") {
                    soundManager.playCompleteSound()
                }
                .font(.caption2)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.purple.opacity(0.2))
                .foregroundColor(.purple)
                .cornerRadius(4)
            }
        }
    }
}

struct KeyboardShortcutsSection: View {
    let shortcuts = [
        ("Start/Pause Timer", "Space"),
        ("Reset Timer", "R"),
        ("End Session", "Esc"),
        ("Open Settings", "Cmd+,"),
        ("Toggle Analytics", "A")
    ]
    
    var body: some View {
        VStack(spacing: 8) {
            ForEach(shortcuts, id: \.0) { shortcut in
                HStack {
                    Text(shortcut.0)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Spacer()
                    
                    Text(shortcut.1)
                        .font(.caption2)
                        .fontWeight(.semibold)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.gray.opacity(0.3))
                        .foregroundColor(.white)
                        .cornerRadius(3)
                }
            }
        }
    }
}

// MARK: - Helper Views

struct SettingsCard<Content: View>: View {
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

struct SettingsNumberField: View {
    let title: String
    @Binding var value: Int
    let range: ClosedRange<Int>
    
    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            
            TextField("", value: $value, format: .number)
                .textFieldStyle(CompactRetroTextFieldStyle())
                .onChange(of: value) { newValue in
                    value = min(max(newValue, range.lowerBound), range.upperBound)
                }
        }
    }
}

struct SettingsToggle: View {
    let title: String
    @Binding var isOn: Bool
    
    var body: some View {
        HStack {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            
            Spacer()
            
            Toggle("", isOn: $isOn)
                .toggleStyle(SwitchToggleStyle(tint: .cyan))
                .scaleEffect(0.8)
        }
    }
}

struct CompactRetroTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding(8)
            .background(
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.black.opacity(0.4))
                    .overlay(
                        RoundedRectangle(cornerRadius: 4)
                            .stroke(Color.cyan.opacity(0.6), lineWidth: 1)
                    )
            )
            .foregroundColor(.white)
            .font(.caption)
    }
}

#Preview {
    SettingsView()
        .environmentObject(WebsiteBlocker())
        .environmentObject(SoundManager())
        .frame(width: 1000, height: 700)
}