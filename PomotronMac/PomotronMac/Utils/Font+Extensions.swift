import SwiftUI

extension Font {
    // MARK: - Pomotron Typography System
    
    /// Main title font - Orbitron 36pt for headers like "POMOTRON"
    static func pomotronTitle(size: CGFloat = 36) -> Font {
        return .custom("Orbitron", size: size).weight(.black)
    }
    
    /// Timer display font - Orbitron 140pt for the main countdown timer
    static func pomotronTimer(size: CGFloat = 140) -> Font {
        return .custom("Orbitron", size: size).weight(.black)
    }
    
    /// Section headings - Orbitron 24pt for section headers
    static func pomotronHeading(size: CGFloat = 24) -> Font {
        return .custom("Orbitron", size: size).weight(.bold)
    }
    
    /// Body text - Inter 16pt for descriptions, buttons, and UI text
    static func pomotronBody(size: CGFloat = 16) -> Font {
        return .custom("Inter", size: size).weight(.medium)
    }
    
    /// Monospace text - ShareTechMono 14pt for technical/code text
    static func pomotronMono(size: CGFloat = 14) -> Font {
        return .custom("ShareTechMono-Regular", size: size)
    }
}

// MARK: - Font Weight Extensions
extension Font {
    func pomotronWeight(_ weight: Font.Weight) -> Font {
        return self.weight(weight)
    }
}