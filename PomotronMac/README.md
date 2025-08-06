# Pomotron macOS

A native macOS version of the Pomotron Pomodoro timer with advanced website blocking functionality and retro synthwave aesthetics.

## Features

### 🎯 Core Pomodoro Functionality
- **Customizable Timer**: Focus sessions (25min), short breaks (5min), long breaks (15min)
- **Intention Setting**: Define your task and motivation before each focus session
- **Auto-cycle Management**: Automatic progression through Pomodoro cycles
- **Session Analytics**: Track productivity metrics and progress over time

### 🚫 Advanced Website Blocking
- **Multi-method Blocking**: Uses hosts file modification, AppleScript browser control, and script injection
- **Browser Support**: Safari, Chrome, Firefox, and Microsoft Edge
- **Friction Override**: Optional confirmation dialog to break focus sessions
- **Background Monitoring**: Continuously monitors and blocks new tabs during focus sessions

### 🎨 Retro Synthwave UI
- **1980s Aesthetic**: Neon colors, grid overlays, and synthwave gradients
- **Custom Typography**: Orbitron font for headers, modern sans-serif for body text
- **Animated Elements**: Smooth transitions and hover effects
- **Dark Theme**: Optimized for low-light productivity sessions

### 🔊 Retro Sound System
- **Synthwave Audio**: Procedurally generated retro-style sounds
- **Audio Effects**: Reverb and delay for authentic 80s sound
- **Sound Events**: Start, pause, completion, and tick sounds
- **Volume Control**: Adjustable volume and mute functionality

### 📊 Analytics & Insights
- **Session Tracking**: Comprehensive logging of all Pomodoro sessions
- **Visual Charts**: Weekly progress, session distribution, and daily patterns
- **Productivity Metrics**: Completion rates, focus time, and streak tracking
- **Recent Activity**: Quick overview of recent sessions and intentions

## System Requirements

- **macOS**: 14.0 (Sonoma) or later
- **Xcode**: 15.0 or later
- **Architecture**: Intel x64 or Apple Silicon (M1/M2/M3)

## Installation & Setup

### 1. Download and Open Project
```bash
# Clone or download the project
# Open PomotronMac.xcodeproj in Xcode
```

### 2. Configure Permissions

The app requires specific permissions for website blocking functionality:

#### Accessibility Permissions
1. Go to **System Preferences** > **Security & Privacy** > **Privacy**
2. Click **Accessibility** in the sidebar
3. Click the lock to make changes (enter your password)
4. Add **Pomotron** to the list of allowed apps
5. Ensure the checkbox next to Pomotron is checked

#### Administrator Privileges
For hosts file modification, the app will request administrator privileges when:
- Starting a focus session with website blocking enabled
- The first time you enable website blocking

### 3. Build and Run
1. Select your development team in **Signing & Capabilities**
2. Choose **Any Mac** as the destination
3. Press **Cmd+R** to build and run

## Website Blocking Implementation

Pomotron uses a multi-layered approach to ensure effective website blocking:

### Method 1: Hosts File Modification
- **Most Effective**: Blocks websites at the system level
- **Requires**: Administrator privileges
- **Coverage**: All browsers and applications
- **Implementation**: Temporary modification of `/etc/hosts`

### Method 2: Browser Script Control
- **AppleScript Integration**: Direct browser control via AppleScript
- **Real-time Blocking**: Closes tabs and injects blocking overlays
- **Browser Support**: Safari, Chrome, Firefox, Edge
- **Fallback Method**: When hosts modification fails

### Method 3: Background Monitoring
- **Continuous Scanning**: 5-second intervals during focus sessions
- **New Tab Detection**: Automatically closes newly opened blocked sites
- **Persistent Blocking**: Maintains block state throughout session

## Customization

### Timer Settings
- **Focus Duration**: 1-120 minutes (default: 25)
- **Break Duration**: 1-60 minutes (default: 5)
- **Long Break Duration**: 1-120 minutes (default: 15)
- **Cycles Before Long Break**: 1-10 cycles (default: 4)
- **Auto-start**: Automatically begin next session
- **Soft Start**: 5-second countdown before session begins

### Website Blocking
- **Blocked Sites List**: Customizable list of websites to block
- **Friction Override**: Optional confirmation dialog to override blocking
- **Permission Management**: Easy access to system permission settings

### Sound Settings
- **Volume Control**: 0-100% adjustable volume
- **Mute Option**: Complete audio disable
- **Sound Testing**: Preview different notification sounds

## Troubleshooting

### Common Issues

#### Website Blocking Not Working
1. **Check Permissions**: Ensure Accessibility permissions are granted
2. **Administrator Rights**: Confirm you can enter admin password when prompted
3. **Browser Support**: Some browsers may require additional setup
4. **Restart App**: Close and reopen Pomotron after granting permissions

#### App Won't Start
1. **macOS Version**: Ensure you're running macOS 14.0 or later
2. **Code Signing**: Check development team is selected in Xcode
3. **Permissions**: Review all required permissions in System Preferences

#### Sounds Not Playing
1. **Volume Settings**: Check both app and system volume levels
2. **Audio Permissions**: Ensure app has microphone/audio access if prompted
3. **Output Device**: Verify correct audio output device is selected

### Permission Troubleshooting

If website blocking isn't working:

1. **Reset Permissions**:
   ```bash
   # Reset accessibility database (requires restart)
   sudo tccutil reset Accessibility
   ```

2. **Manual Permission Grant**:
   - Open **System Preferences** > **Security & Privacy**
   - Go to **Privacy** > **Accessibility**
   - Remove Pomotron if listed, then re-add it
   - Restart the application

3. **Verify Hosts File Access**:
   ```bash
   # Check if hosts file is writable (with admin privileges)
   ls -la /etc/hosts
   ```

## Development Notes

### Architecture Overview
- **SwiftUI**: Modern declarative UI framework
- **Combine**: Reactive programming for state management
- **AVAudioEngine**: Real-time audio synthesis and effects
- **OSAKit**: AppleScript integration for browser control
- **UserDefaults**: Persistent settings and session storage

### Key Classes
- **TimerManager**: Core Pomodoro logic and session management
- **WebsiteBlocker**: Multi-method website blocking implementation
- **SoundManager**: Retro audio synthesis and effects
- **PomotronSettings**: Configuration and persistence layer

### Testing Website Blocking
```swift
// Test different blocking methods
websiteBlocker.testHostsBlocking()
websiteBlocker.testBrowserScriptBlocking()
websiteBlocker.testAppleScriptBlocking()
```

## Contributing

When contributing to the website blocking functionality:

1. **Test on Multiple Browsers**: Ensure compatibility with Safari, Chrome, Firefox, and Edge
2. **Handle Permissions Gracefully**: Provide clear error messages for permission issues
3. **Maintain Security**: Never compromise system security for blocking effectiveness
4. **Follow Apple Guidelines**: Ensure compliance with App Store guidelines if distributing

## Privacy & Security

- **Local Data Only**: All session data stored locally using UserDefaults
- **Minimal Permissions**: Only requests necessary system permissions
- **Temporary Changes**: Hosts file modifications are automatically reverted
- **No Network Access**: No data transmitted to external servers
- **Secure Storage**: Settings and history encrypted using system APIs

## License

This project is created for educational purposes. Please ensure compliance with your organization's security policies before deployment.

---

## Support

For technical support or feature requests:
1. Check the troubleshooting section above
2. Verify all permissions are correctly granted
3. Test with different browsers to isolate issues
4. Check Console.app for any error messages from Pomotron

**Note**: Website blocking functionality requires administrator privileges and may be restricted by enterprise security policies. Always test in your specific environment before deployment.