import Cocoa
import SafariServices
import WebKit

class ContentViewController: NSViewController {
    @IBOutlet var appNameLabel: NSTextField!
    @IBOutlet var appDescriptionLabel: NSTextField!
    @IBOutlet var extensionStatusLabel: NSTextField!
    @IBOutlet var openSafariPrefsButton: NSButton!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Set up the UI
        setupUI()
    }
    
    private func setupUI() {
        // Create and configure the app name label
        appNameLabel = NSTextField(labelWithString: "ZK Age Verification")
        appNameLabel.font = NSFont.systemFont(ofSize: 24, weight: .bold)
        appNameLabel.alignment = .center
        
        // Create and configure the app description label
        appDescriptionLabel = NSTextField(labelWithString: "This extension allows you to verify your age using zero-knowledge proofs, protecting your privacy.")
        appDescriptionLabel.font = NSFont.systemFont(ofSize: 13)
        appDescriptionLabel.alignment = .center
        appDescriptionLabel.maximumNumberOfLines = 0
        appDescriptionLabel.preferredMaxLayoutWidth = 400
        
        // Create and configure the extension status label
        extensionStatusLabel = NSTextField(labelWithString: "Checking extension status...")
        extensionStatusLabel.font = NSFont.systemFont(ofSize: 13)
        extensionStatusLabel.alignment = .center
        extensionStatusLabel.textColor = NSColor.secondaryLabelColor
        
        // Create and configure the open Safari preferences button
        openSafariPrefsButton = NSButton(title: "Open Safari Extension Preferences", target: self, action: #selector(openSafariExtensionPreferences))
        openSafariPrefsButton.bezelStyle = .rounded
        
        // Create a stack view for vertical layout
        let stackView = NSStackView(views: [appNameLabel, appDescriptionLabel, extensionStatusLabel, openSafariPrefsButton])
        stackView.orientation = .vertical
        stackView.alignment = .centerX
        stackView.spacing = 16
        stackView.edgeInsets = NSEdgeInsets(top: 20, left: 20, bottom: 20, right: 20)
        
        // Set the stack view as the content view
        self.view = stackView
        
        // Set the view's frame
        self.view.frame = NSRect(x: 0, y: 0, width: 480, height: 300)
    }
    
    func updateExtensionState(_ state: SFSafariExtensionState) {
        if state.isEnabled {
            extensionStatusLabel.stringValue = "Extension is enabled"
            extensionStatusLabel.textColor = NSColor.systemGreen
        } else {
            extensionStatusLabel.stringValue = "Extension is disabled. Click the button below to enable it."
            extensionStatusLabel.textColor = NSColor.systemRed
        }
    }
    
    @objc func openSafariExtensionPreferences() {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: "com.example.ZKAgeVerification.Extension") { error in
            guard error == nil else {
                // Handle error
                print("Error showing Safari extension preferences: \(error!.localizedDescription)")
                return
            }
        }
    }
}
