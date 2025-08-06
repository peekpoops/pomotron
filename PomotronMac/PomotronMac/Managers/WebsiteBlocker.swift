import Foundation
import AppKit
import OSAKit

class WebsiteBlocker: ObservableObject {
    @Published var isBlocking = false
    @Published var blockedSites: [String] = []
    @Published var permissionGranted = false
    
    private let settings = PomotronSettings.shared
    private var hostsBackupPath: URL?
    private var originalHosts: String = ""
    
    init() {
        checkPermissions()
        blockedSites = settings.blockedSites
    }
    
    // MARK: - Permission Management
    
    func checkPermissions() {
        // Check if we have permission to run AppleScript
        let script = """
        tell application "System Events"
            return true
        end tell
        """
        
        guard let appleScript = NSAppleScript(source: script) else {
            permissionGranted = false
            return
        }
        
        var errorDict: NSDictionary?
        let result = appleScript.executeAndReturnError(&errorDict)
        
        if errorDict != nil {
            permissionGranted = false
            requestPermissions()
        } else {
            permissionGranted = true
        }
    }
    
    private func requestPermissions() {
        DispatchQueue.main.async {
            let alert = NSAlert()
            alert.messageText = "Permission Required"
            alert.informativeText = """
            Pomotron needs permission to:
            1. Control system events (for website blocking)
            2. Run administrator commands (to modify hosts file)
            
            Please grant these permissions in System Preferences > Security & Privacy > Privacy.
            """
            alert.alertStyle = .warning
            alert.addButton(withTitle: "Open System Preferences")
            alert.addButton(withTitle: "Cancel")
            
            let response = alert.runModal()
            if response == .alertFirstButtonReturn {
                NSWorkspace.shared.open(URL(string: "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")!)
            }
        }
    }
    
    // MARK: - Website Blocking Implementation
    
    func startBlocking() {
        guard permissionGranted && settings.websiteBlockingEnabled else { return }
        
        isBlocking = true
        blockedSites = settings.blockedSites
        
        // Method 1: Hosts file modification (most effective)
        modifyHostsFile(block: true)
        
        // Method 2: Browser script injection (backup method)
        injectBrowserScripts()
        
        // Method 3: Close existing browser tabs with blocked sites
        closeBlockedTabs()
    }
    
    func stopBlocking() {
        guard isBlocking else { return }
        
        isBlocking = false
        
        // Restore hosts file
        modifyHostsFile(block: false)
        
        // Remove browser scripts
        removeBrowserScripts()
    }
    
    // MARK: - Hosts File Method
    
    private func modifyHostsFile(block: Bool) {
        let hostsPath = "/etc/hosts"
        
        if block {
            backupHostsFile()
            addBlockedSitesToHosts()
        } else {
            restoreHostsFile()
        }
    }
    
    private func backupHostsFile() {
        let script = """
        do shell script "cp /etc/hosts /tmp/hosts_backup" with administrator privileges
        """
        
        executeAppleScript(script)
    }
    
    private func addBlockedSitesToHosts() {
        let blockedEntries = blockedSites.map { "127.0.0.1 \($0)" }.joined(separator: "\\n")
        let script = """
        do shell script "echo '\\n# Pomotron Blocked Sites\\n\(blockedEntries)\\n# End Pomotron' >> /etc/hosts" with administrator privileges
        """
        
        executeAppleScript(script)
    }
    
    private func restoreHostsFile() {
        let script = """
        do shell script "cp /tmp/hosts_backup /etc/hosts" with administrator privileges
        """
        
        executeAppleScript(script)
    }
    
    // MARK: - Browser Control Methods
    
    private func closeBlockedTabs() {
        closeBlockedTabsInSafari()
        closeBlockedTabsInChrome()
        closeBlockedTabsInFirefox()
        closeBlockedTabsInEdge()
    }
    
    private func closeBlockedTabsInSafari() {
        let blockedSitesCondition = blockedSites.map { "URL contains \"\($0)\"" }.joined(separator: " or ")
        
        let script = """
        tell application "Safari"
            if it is running then
                repeat with w in windows
                    set tabsToClose to {}
                    repeat with t in tabs of w
                        if \(blockedSitesCondition) then
                            set end of tabsToClose to t
                        end if
                    end repeat
                    repeat with t in tabsToClose
                        close t
                    end repeat
                end repeat
            end if
        end tell
        """
        
        executeAppleScript(script)
    }
    
    private func closeBlockedTabsInChrome() {
        let script = """
        tell application "Google Chrome"
            if it is running then
                repeat with w in windows
                    set tabsToClose to {}
                    repeat with t in tabs of w
                        set tabURL to URL of t
                        repeat with blockedSite in {"\(blockedSites.joined(separator: "\", \""))"}
                            if tabURL contains blockedSite then
                                set end of tabsToClose to t
                                exit repeat
                            end if
                        end repeat
                    end repeat
                    repeat with t in tabsToClose
                        close t
                    end repeat
                end repeat
            end if
        end tell
        """
        
        executeAppleScript(script)
    }
    
    private func closeBlockedTabsInFirefox() {
        // Firefox requires different approach - send keyboard shortcuts
        let script = """
        tell application "System Events"
            if exists (process "Firefox") then
                tell process "Firefox"
                    set frontmost to true
                    -- Use Command+Option+Shift+K to open developer console
                    key code 40 using {command down, option down, shift down}
                    delay 0.5
                    -- Execute JavaScript to close blocked tabs
                    keystroke "Array.from(document.querySelectorAll('tab')).forEach(tab => { const url = tab.getAttribute('src'); if (url && ['\(blockedSites.joined(separator: "', '"))'].some(site => url.includes(site))) { tab.remove(); } });"
                    key code 36 -- Enter
                    delay 0.5
                    key code 53 -- Escape to close console
                end tell
            end if
        end tell
        """
        
        executeAppleScript(script)
    }
    
    private func closeBlockedTabsInEdge() {
        let script = """
        tell application "Microsoft Edge"
            if it is running then
                repeat with w in windows
                    set tabsToClose to {}
                    repeat with t in tabs of w
                        set tabURL to URL of t
                        repeat with blockedSite in {"\(blockedSites.joined(separator: "\", \""))"}
                            if tabURL contains blockedSite then
                                set end of tabsToClose to t
                                exit repeat
                            end if
                        end repeat
                    end repeat
                    repeat with t in tabsToClose
                        close t
                    end repeat
                end repeat
            end if
        end tell
        """
        
        executeAppleScript(script)
    }
    
    // MARK: - Browser Script Injection
    
    private func injectBrowserScripts() {
        // Inject blocking scripts into browsers that support it
        injectSafariBlockingScript()
    }
    
    private func injectSafariBlockingScript() {
        let blockedSitesJS = blockedSites.map { "'\($0)'" }.joined(separator: ", ")
        
        let script = """
        tell application "Safari"
            if it is running then
                repeat with w in windows
                    repeat with t in tabs of w
                        try
                            do JavaScript "
                                const blockedSites = [\(blockedSitesJS)];
                                const currentHost = window.location.hostname;
                                if (blockedSites.some(site => currentHost.includes(site))) {
                                    document.body.innerHTML = '<div style=\"position:fixed;top:0;left:0;width:100%;height:100%;background:linear-gradient(135deg,#ff006e,#8338ec);color:white;display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:24px;z-index:999999;\"><div style=\"text-align:center;\"><h1>🚫 WEBSITE BLOCKED</h1><p>Focus time is active in Pomotron</p><p>Stay focused on your goals!</p></div></div>';
                                }
                            " in t
                        end try
                    end repeat
                end repeat
            end if
        end tell
        """
        
        executeAppleScript(script)
    }
    
    private func removeBrowserScripts() {
        // Remove any injected blocking scripts
        let script = """
        tell application "Safari"
            if it is running then
                repeat with w in windows
                    repeat with t in tabs of w
                        try
                            do JavaScript "
                                const blockingDiv = document.querySelector('div[style*=\"999999\"]');
                                if (blockingDiv) {
                                    blockingDiv.remove();
                                    location.reload();
                                }
                            " in t
                        end try
                    end repeat
                end repeat
            end if
        end tell
        """
        
        executeAppleScript(script)
    }
    
    // MARK: - Friction Override
    
    func requestOverride(completion: @escaping (Bool) -> Void) {
        guard settings.frictionOverride else {
            completion(false)
            return
        }
        
        DispatchQueue.main.async {
            let alert = NSAlert()
            alert.messageText = "Override Website Blocking?"
            alert.informativeText = """
            You're requesting to override the website blocker during your focus session.
            
            Are you sure you want to break your focus? Remember why you started this session.
            
            Current intention: \(TimerManager().timerState.currentIntention.task)
            """
            alert.alertStyle = .warning
            alert.addButton(withTitle: "Stay Focused")
            alert.addButton(withTitle: "Override (Break Focus)")
            
            let response = alert.runModal()
            completion(response == .alertSecondButtonReturn)
        }
    }
    
    // MARK: - Helper Methods
    
    private func executeAppleScript(_ script: String) {
        guard let appleScript = NSAppleScript(source: script) else { return }
        
        var errorDict: NSDictionary?
        appleScript.executeAndReturnError(&errorDict)
        
        if let error = errorDict {
            print("AppleScript error: \(error)")
        }
    }
    
    func addBlockedSite(_ site: String) {
        let cleanSite = site.lowercased()
            .replacingOccurrences(of: "https://", with: "")
            .replacingOccurrences(of: "http://", with: "")
            .replacingOccurrences(of: "www.", with: "")
        
        if !blockedSites.contains(cleanSite) {
            blockedSites.append(cleanSite)
            settings.blockedSites = blockedSites
            settings.saveSettings()
        }
    }
    
    func removeBlockedSite(_ site: String) {
        blockedSites.removeAll { $0 == site }
        settings.blockedSites = blockedSites
        settings.saveSettings()
    }
    
    // MARK: - Background monitoring
    
    func startBackgroundMonitoring() {
        // Monitor for new browser windows/tabs opening to blocked sites
        Timer.scheduledTimer(withTimeInterval: 5.0, repeats: true) { _ in
            if self.isBlocking {
                self.closeBlockedTabs()
            }
        }
    }
}