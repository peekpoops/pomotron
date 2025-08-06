import Foundation
import AVFoundation

class AudioManager: ObservableObject {
    private var audioEngine: AVAudioEngine?
    private var audioPlayerNode: AVAudioPlayerNode?
    
    init() {
        setupAudioEngine()
    }
    
    private func setupAudioEngine() {
        audioEngine = AVAudioEngine()
        audioPlayerNode = AVAudioPlayerNode()
        
        guard let engine = audioEngine, let player = audioPlayerNode else { return }
        
        engine.attach(player)
        engine.connect(player, to: engine.mainMixerNode, format: nil)
        
        do {
            try engine.start()
        } catch {
            print("Failed to start audio engine: \(error)")
        }
    }
    
    func playNotificationSound() {
        // Use system sound as fallback for macOS compatibility
        let systemSound: UInt32 = 1000 // Default system alert sound
        AudioServicesPlaySystemSound(systemSound)
    }
    
    func playFocusStartSound() {
        playNotificationSound()
    }
    
    func playBreakStartSound() {
        playNotificationSound()
    }
    
    func playSessionCompleteSound() {
        playNotificationSound()
    }
}