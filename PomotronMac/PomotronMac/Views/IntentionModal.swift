import SwiftUI

struct IntentionModal: View {
    @Environment(\.dismiss) private var dismiss
    @State private var task = ""
    @State private var why = ""
    @State private var showValidation = false
    
    let onSubmit: ((task: String, why: String)) -> Void
    
    var body: some View {
        ZStack {
            // Background blur and gradient
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0.067, green: 0.024, blue: 0.137), // hsl(240, 45%, 7%)
                    Color.black
                ]),
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            
            // Grid pattern overlay
            GridPatternView()
                .opacity(0.1)
                .ignoresSafeArea()
            
            // Modal content
            VStack(spacing: 32) {
                // Header
                VStack(spacing: 16) {
                    Text("SET YOUR INTENTION")
                        .font(.custom("Orbitron", size: 32))
                        .fontWeight(.black)
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
                    
                    Text("What are you working on today?")
                        .font(.custom("Orbitron", size: 16))
                        .fontWeight(.medium)
                        .foregroundColor(.white.opacity(0.8))
                        .multilineTextAlignment(.center)
                }
                
                // Input fields
                VStack(spacing: 24) {
                    // Task input
                    VStack(alignment: .leading, spacing: 12) {
                        Text("TASK")
                            .font(.custom("Orbitron", size: 14))
                            .fontWeight(.bold)
                            .foregroundColor(Color(red: 0.263, green: 0.824, blue: 0.824))
                        
                        TextField("What are you working on today?", text: $task)
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.white)
                            .padding(16)
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color.black.opacity(0.4))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12)
                                            .stroke(
                                                task.isEmpty ? Color.gray.opacity(0.3) : Color(red: 0.263, green: 0.824, blue: 0.824).opacity(0.6),
                                                lineWidth: 2
                                            )
                                    )
                            )
                            .textFieldStyle(PlainTextFieldStyle())
                    }
                    
                    // Why input
                    VStack(alignment: .leading, spacing: 12) {
                        Text("WHY (OPTIONAL)")
                            .font(.custom("Orbitron", size: 14))
                            .fontWeight(.bold)
                            .foregroundColor(Color(red: 0.945, green: 0.431, blue: 0.765))
                        
                        TextField("Why is this important to you?", text: $why)
                            .font(.system(size: 16, weight: .medium))
                            .foregroundColor(.white)
                            .padding(16)
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color.black.opacity(0.4))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 12)
                                            .stroke(
                                                why.isEmpty ? Color.gray.opacity(0.3) : Color(red: 0.945, green: 0.431, blue: 0.765).opacity(0.6),
                                                lineWidth: 2
                                            )
                                    )
                            )
                            .textFieldStyle(PlainTextFieldStyle())
                    }
                }
                .padding(.horizontal, 40)
                
                // Action Buttons
                VStack(spacing: 16) {
                    // Primary action button
                    Button("Start Focused Session") {
                        print("Start Focused Session button tapped")
                        if task.isEmpty {
                            showValidation = true
                            return
                        }
                        
                        onSubmit((task, why))
                        dismiss()
                    }
                    .font(.custom("Orbitron", size: 18))
                    .fontWeight(.bold)
                    .foregroundColor(.white)
                    .padding(.horizontal, 32)
                    .padding(.vertical, 16)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(
                                LinearGradient(
                                    colors: [
                                        Color(red: 0.945, green: 0.431, blue: 0.765).opacity(0.8),
                                        Color(red: 0.647, green: 0.329, blue: 0.808).opacity(0.6)
                                    ],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color(red: 0.945, green: 0.431, blue: 0.765), lineWidth: 2)
                            )
                    )
                    .shadow(color: Color(red: 0.945, green: 0.431, blue: 0.765).opacity(0.4), radius: 12)
                    
                    // Secondary action button
                    Button("Skip & Start") {
                        print("Skip & Start button tapped")
                        onSubmit(("Quick focus session", ""))
                        dismiss()
                    }
                    .font(.custom("Orbitron", size: 16))
                    .fontWeight(.semibold)
                    .foregroundColor(Color(red: 0.263, green: 0.824, blue: 0.824))
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(
                        RoundedRectangle(cornerRadius: 12)
                            .fill(Color.clear)
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .stroke(Color(red: 0.263, green: 0.824, blue: 0.824).opacity(0.6), lineWidth: 2)
                            )
                    )
                }
                .padding(.horizontal, 40)
            }
            .padding(40)
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(Color.black.opacity(0.8))
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(
                                LinearGradient(
                                    colors: [
                                        Color(red: 0.945, green: 0.431, blue: 0.765).opacity(0.3),
                                        Color(red: 0.263, green: 0.824, blue: 0.824).opacity(0.3)
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1
                            )
                    )
            )
            .shadow(color: .black.opacity(0.5), radius: 20)
            .frame(maxWidth: 500)
        }
        .alert("Task Required", isPresented: $showValidation) {
            Button("OK") { }
        } message: {
            Text("Please enter what you're working on today.")
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

#Preview {
    IntentionModal { intention in
        print("Intention: \(intention)")
    }
    .frame(width: 768, height: 1200)
}