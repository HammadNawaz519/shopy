import UIKit
import WebKit
import QuartzCore
import Capacitor

/// Capacitor's bridge view controller, subclassed so we can raise the WKWebView's
/// preferred frame-rate range to 120Hz on ProMotion iPhones.
class ShopyBridgeViewController: CAPBridgeViewController {
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        if #available(iOS 15.0, *) {
            findWebView(in: view)?.scrollView.preferredFrameRateRange =
                CAFrameRateRange(minimum: 80, maximum: 120, preferred: 120)
        }
    }

    private func findWebView(in v: UIView) -> WKWebView? {
        if let webView = v as? WKWebView { return webView }
        for sub in v.subviews {
            if let found = findWebView(in: sub) { return found }
        }
        return nil
    }
}

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = ShopyBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
