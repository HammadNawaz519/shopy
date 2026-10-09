import UIKit
import WebKit
import QuartzCore
import Capacitor

/// Capacitor's bridge view controller, subclassed so we can raise the WKWebView's
/// preferred frame-rate range to 120Hz on ProMotion iPhones.
///
/// Getting web content above 60fps on iPhone needs BOTH:
///   1. `CADisableMinimumFrameDurationOnPhone = YES` in Info.plist (already set).
///   2. The WKWebView and its internal scroll view opting into the 120Hz range.
/// WebKit can reset this after the first page load, so we re-apply it on appear,
/// on every layout pass, and whenever the app returns to the foreground.
class ShopyBridgeViewController: CAPBridgeViewController {

    private static let proMotionRange = CAFrameRateRange(minimum: 80, maximum: 120, preferred: 120)

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        applyHighRefreshRate()
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(applyHighRefreshRate),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        applyHighRefreshRate()
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    @objc private func applyHighRefreshRate() {
        guard #available(iOS 15.0, *) else { return }
        guard let webView = findWebView(in: view) else { return }
        // The scroll view drives scroll/deceleration frame scheduling; the web
        // view itself drives composited web-animation scheduling. Set both, and
        // every time (WebKit resets the range after loads).
        webView.preferredFrameRateRange = Self.proMotionRange
        webView.scrollView.preferredFrameRateRange = Self.proMotionRange
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
