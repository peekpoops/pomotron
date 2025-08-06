import SwiftUI
import CoreText

class FontManager: ObservableObject {
    static let shared = FontManager()
    
    private init() {
        registerFonts()
    }
    
    private func registerFonts() {
        registerFont("Orbitron-Variable")
        registerFont("Inter-Variable") 
        registerFont("ShareTechMono-Regular")
    }
    
    private func registerFont(_ fontName: String) {
        guard let fontURL = Bundle.main.url(forResource: fontName, withExtension: "ttf"),
              let fontData = NSData(contentsOf: fontURL),
              let dataProvider = CGDataProvider(data: fontData),
              let cgFont = CGFont(dataProvider) else {
            print("Failed to load font: \(fontName)")
            return
        }
        
        var error: Unmanaged<CFError>?
        if !CTFontManagerRegisterGraphicsFont(cgFont, &error) {
            print("Failed to register font: \(fontName) - \(String(describing: error))")
        } else {
            print("Successfully registered font: \(fontName)")
        }
    }
    
    // Font convenience methods matching web UI
    static func orbitron(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        switch weight {
        case .black, .heavy:
            return Font.custom("Orbitron", size: size).weight(.black)
        case .bold:
            return Font.custom("Orbitron", size: size).weight(.bold)
        default:
            return Font.custom("Orbitron", size: size).weight(.regular)
        }
    }
    
    static func inter(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        return Font.custom("Inter", size: size).weight(weight)
    }
    
    static func shareTechMono(size: CGFloat) -> Font {
        return Font.custom("Share Tech Mono", size: size)
    }
    
    // Fallback fonts for when custom fonts aren't available
    static func orbitronFallback(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        return Font.system(size: size, weight: weight, design: .monospaced)
    }
    
    static func interFallback(size: CGFloat, weight: Font.Weight = .regular) -> Font {
        return Font.system(size: size, weight: weight, design: .default)
    }
    
    static func shareMonoFallback(size: CGFloat) -> Font {
        return Font.system(size: size, weight: .regular, design: .monospaced)
    }
}

// SwiftUI Font Extensions for easy usage
extension Font {
    static func pomotronTitle(size: CGFloat = 36) -> Font {
        FontManager.orbitron(size: size, weight: .black)
    }
    
    static func pomotronTimer(size: CGFloat = 140) -> Font {
        FontManager.orbitron(size: size, weight: .black)
    }
    
    static func pomotronHeading(size: CGFloat = 24) -> Font {
        FontManager.orbitron(size: size, weight: .bold)
    }
    
    static func pomotronBody(size: CGFloat = 16) -> Font {
        FontManager.inter(size: size, weight: .regular)
    }
    
    static func pomotronMono(size: CGFloat = 14) -> Font {
        FontManager.shareTechMono(size: size)
    }
}