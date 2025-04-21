import Cocoa
import SafariServices
import WebKit

@main
class AppDelegate: NSObject, NSApplicationDelegate {
    var window: NSWindow!
    
    func applicationDidFinishLaunching(_ notification: Notification) {
        // Create the window and set its content view
        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 480, height: 300),
            styleMask: [.titled, .closable, .miniaturizable, .resizable],
            backing: .buffered,
            defer: false
        )
        window.center()
        window.setFrameAutosaveName("Main Window")
        
        // Create the content view controller
        let contentViewController = ContentViewController()
        window.contentViewController = contentViewController
        
        // Show the window
        window.makeKeyAndOrderFront(nil)
        
        // Check if the extension is enabled
        SFSafariExtensionManager.getStateOfSafariExtension(
            withIdentifier: "com.example.ZKAgeVerification.Extension"
        ) { (state, error) in
            guard let state = state, error == nil else {
                // Handle error
                print("Error getting Safari extension state: \(error?.localizedDescription ?? "Unknown error")")
                return
            }
            
            DispatchQueue.main.async {
                contentViewController.updateExtensionState(state)
            }
        }
    }
    
    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}
