// src/utils/notificationService.ts

/**
 * Requests permission from the browser to show desktop/mobile notifications.
 */
export const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notifications.");
      return false;
    }
  
    if (Notification.permission === "granted") {
      return true;
    }
  
    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      return permission === "granted";
    }
  
    return false;
  };
  
  /**
   * Triggers a native system notification
   */
  export const sendNotification = (title: string, body: string) => {
    if (Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/logo192.png", // Ensure this path matches your public folder icon
        vibrate: [200, 100, 200],
        tag: "medipredict-alert", // Prevents stacking duplicate alerts
      });
    }
  };