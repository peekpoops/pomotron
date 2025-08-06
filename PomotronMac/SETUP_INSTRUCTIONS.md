# Pomotron macOS - Quick Setup Guide

## Step-by-Step Setup

### 1. Open in Xcode
1. Download/extract the PomotronMac folder
2. Double-click `PomotronMac.xcodeproj` to open in Xcode
3. Wait for Xcode to load the project

### 2. Configure Code Signing
1. Click on **PomotronMac** project in the navigator (top-left)
2. Select **PomotronMac** target in the main area
3. Go to **Signing & Capabilities** tab
4. Select your **Team** from the dropdown (your Apple ID)
5. The **Bundle Identifier** will automatically update

### 3. Build the App
1. In Xcode, select **Any Mac** from the destination dropdown (top toolbar)
2. Press **Cmd+R** or click the **Play** button to build and run
3. Wait for the build to complete (first build may take 2-3 minutes)

### 4. Grant Required Permissions

When you first run the app, you'll need to grant permissions:

#### Accessibility Permission (Required for Website Blocking)
1. The app will show a permission dialog
2. Click **"Open System Preferences"**
3. In **System Preferences** > **Security & Privacy** > **Privacy**
4. Click **Accessibility** in the left sidebar
5. Click the **lock icon** and enter your password
6. Find **Pomotron** in the list and **check the box** next to it
7. If Pomotron isn't in the list, click **"+"** and add it

#### Administrator Permission (For Website Blocking)
- When you start a focus session, the app will ask for your admin password
- This allows the app to temporarily modify the hosts file to block websites
- Enter your password when prompted

### 5. Test Website Blocking

To verify website blocking works:

1. Start the Pomotron app
2. Go to **Settings** tab
3. Ensure **"Enable website blocking"** is turned ON
4. Check that sites like "facebook.com" are in the blocked list
5. Start a focus session from the **Timer** tab
6. Try opening a blocked website in your browser
7. You should see the site is blocked or redirected

### 6. Troubleshooting

#### If Website Blocking Doesn't Work:
1. **Check Permissions**: Go to System Preferences > Security & Privacy > Privacy > Accessibility
2. **Restart the App**: Quit Pomotron completely and reopen it
3. **Try Different Browser**: Test with Safari, Chrome, or Firefox
4. **Check Admin Rights**: Ensure you can enter your admin password when prompted

#### If the App Won't Build:
1. **macOS Version**: Make sure you're running macOS 14.0 (Sonoma) or later
2. **Xcode Version**: Use Xcode 15.0 or later
3. **Development Team**: Ensure a valid team is selected in Signing & Capabilities
4. **Clean Build**: Go to Product > Clean Build Folder, then try building again

#### If Sounds Don't Play:
1. Check the **Sound Settings** in the app's Settings tab
2. Ensure **"Mute sounds"** is turned OFF
3. Adjust the volume slider in the app
4. Test with the "Test Start" and "Test Complete" buttons

### 7. Using the App

#### Starting a Focus Session:
1. Go to the **Timer** tab
2. Click **"START"** 
3. Fill in your intention (what you're working on and why)
4. Click **"Start Focused Session"**
5. The timer will begin, and websites will be blocked automatically

#### Viewing Analytics:
1. Go to the **Analytics** tab
2. See your progress, session history, and productivity metrics
3. Use the time range selector to view different periods

#### Customizing Settings:
1. Go to the **Settings** tab
2. Adjust timer durations, website blocking, and sound preferences
3. Add or remove blocked websites
4. Test sound effects
5. Click **"Save Settings"** when done

## Ready to Use!

Once setup is complete, you can:
- ✅ Start productive Pomodoro sessions
- ✅ Block distracting websites automatically
- ✅ Track your productivity over time
- ✅ Enjoy the retro synthwave experience

The app will remember your settings and maintain your session history across restarts.

---

### Need Help?

If you encounter any issues:
1. Check the full README.md for detailed troubleshooting
2. Verify all permissions are granted in System Preferences
3. Make sure you're running a supported macOS version (14.0+)
4. Try restarting the app after granting permissions

**Important**: The website blocking feature requires administrator privileges and works best when all permissions are properly granted.