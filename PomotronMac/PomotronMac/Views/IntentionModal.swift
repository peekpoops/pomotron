import SwiftUI

struct IntentionModal: View {
    let onSubmit: ((task: String, why: String)) -> Void
    @Environment(\.dismiss) private var dismiss
    
    @State private var task = ""
    @State private var why = ""
    @State private var showValidation = false
    
    var body: some View {
        ZStack {
            // Background
            LinearGradient(
                gradient: Gradient(stops: [
                    .init(color: Color(red: 0.1, green: 0.05, blue: 0.2), location: 0.0),
                    .init(color: Color(red: 0.2, green: 0.1, blue: 0.3), location: 1.0)
                ]),
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 30) {
                // Header
                VStack(spacing: 16) {
                    Image(systemName: "target")
                        .font(.system(size: 60))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.cyan, .purple],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                    
                    Text("SET YOUR INTENTION")
                        .font(.system(size: 28, weight: .bold, design: .default))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color(red: 1.0, green: 0.4, blue: 0.6), Color(red: 0.6, green: 0.4, blue: 1.0)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                    
                    Text("Focus your mind before you begin")
                        .font(.system(size: 16))
                        .foregroundColor(.secondary)
                }
                
                // Form
                VStack(spacing: 24) {
                    // Task Input
                    VStack(alignment: .leading, spacing: 8) {
                        Text("What are you working on today?")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.white)
                        
                        TextField("Enter your task or goal...", text: $task)
                            .textFieldStyle(RetroTextFieldStyle())
                            .onSubmit {
                                if !task.isEmpty && why.isEmpty {
                                    // Focus on why field if task is filled
                                }
                            }
                        
                        if showValidation && task.isEmpty {
                            Text("Please enter what you're working on")
                                .font(.caption)
                                .foregroundColor(.red)
                        }
                    }
                    
                    // Why Input
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Why is this important to you?")
                            .font(.system(size: 18, weight: .semibold))
                            .foregroundColor(.white)
                        
                        TextField("Your motivation, purpose, or goal...", text: $why, axis: .vertical)
                            .textFieldStyle(RetroTextFieldStyle())
                            .lineLimit(3...6)
                        
                        Text("Optional: This helps maintain focus during challenging moments")
                            .font(.caption2)
                            .foregroundColor(.secondary.opacity(0.7))
                    }
                }
                .padding(.horizontal, 40)
                
                // Action Buttons
                HStack(spacing: 20) {
                    Button("Skip & Start") {
                        onSubmit(("Quick focus session", ""))
                        dismiss()
                    }
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 14)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color.gray.opacity(0.6))
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(Color.gray.opacity(0.8), lineWidth: 1)
                            )
                    )
                    
                    Button("Start Focused Session") {
                        if task.isEmpty {
                            showValidation = true
                            return
                        }
                        
                        onSubmit((task, why))
                        dismiss()
                    }
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 32)
                    .padding(.vertical, 14)
                    .background(
                        RoundedRectangle(cornerRadius: 8)
                            .fill(Color.green)
                            .shadow(color: .green.opacity(0.3), radius: 8)
                    )
                }
                
                Spacer()
            }
            .padding(40)
        }
        .frame(width: 600, height: 500)
    }
}

// MARK: - Custom Styles

struct RetroTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(Color.black.opacity(0.4))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(Color.purple.opacity(0.3), lineWidth: 1)
                    )
            )
            .foregroundColor(.white)
            .font(.system(size: 16))
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.black.opacity(0.4))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.cyan.opacity(0.6), lineWidth: 1)
                    )
            )
            .foregroundColor(.white)
            .font(.system(size: 14, weight: .medium))
    }
}

struct PrimaryRetroButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.custom("Orbitron", size: 16))
            .fontWeight(.bold)
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.cyan.opacity(0.2))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.cyan, lineWidth: 2)
                    )
            )
            .foregroundColor(.cyan)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

struct SecondaryRetroButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.custom("Orbitron", size: 16))
            .fontWeight(.medium)
            .padding(.horizontal, 24)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 8)
                    .fill(Color.gray.opacity(0.2))
                    .overlay(
                        RoundedRectangle(cornerRadius: 8)
                            .stroke(Color.gray, lineWidth: 1)
                    )
            )
            .foregroundColor(.gray)
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
    }
}

#Preview {
    IntentionModal { intention in
        print("Task: \(intention.task)")
        print("Why: \(intention.why)")
    }
}