const { sendEmail } = require('./emailService');
const CheckIn = require('../models/CheckIn');
const User = require('../models/User');

class NotificationService {
  // Send check-in reminder notifications
  static async sendCheckInReminders() {
    try {
      const checkIns = await CheckIn.find({
        status: { $in: ['scheduled', 'pending'] },
        'reminderSettings.enabled': true,
        scheduledDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 24 * 60 * 60 * 1000) // Next 24 hours
        }
      })
      .populate('user', 'email firstName lastName preferences')
      .populate('goal', 'title category')
      .populate('journey', 'title');

      const notifications = [];
      
      for (const checkIn of checkIns) {
        const reminderTime = new Date(checkIn.scheduledDate.getTime() - (checkIn.reminderSettings.advanceTime * 60 * 1000));
        const now = new Date();
        
        // Check if it's time to send reminder
        if (now >= reminderTime && now <= checkIn.scheduledDate) {
          const notification = await this.sendCheckInReminder(checkIn);
          if (notification) {
            notifications.push(notification);
          }
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error sending check-in reminders:', error);
      throw new Error(`Failed to send check-in reminders: ${error.message}`);
    }
  }

  // Send individual check-in reminder
  static async sendCheckInReminder(checkIn) {
    try {
      const user = checkIn.user;
      const goal = checkIn.goal;
      const journey = checkIn.journey;

      if (!user || !goal) {
        console.error('Missing user or goal data for check-in reminder');
        return null;
      }

      const reminderMethods = checkIn.reminderSettings.methods || ['email'];
      const notifications = [];

      for (const method of reminderMethods) {
        switch (method) {
          case 'email':
            const emailNotification = await this.sendEmailReminder(checkIn, user, goal, journey);
            if (emailNotification) notifications.push(emailNotification);
            break;
          case 'push':
            const pushNotification = await this.sendPushReminder(checkIn, user, goal, journey);
            if (pushNotification) notifications.push(pushNotification);
            break;
          case 'in-app':
            const inAppNotification = await this.createInAppReminder(checkIn, user, goal, journey);
            if (inAppNotification) notifications.push(inAppNotification);
            break;
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error sending individual check-in reminder:', error);
      return null;
    }
  }

  // Send email reminder
  static async sendEmailReminder(checkIn, user, goal, journey) {
    try {
      const scheduledTime = new Date(checkIn.scheduledDate).toLocaleString();
      const goalTitle = goal.title;
      const journeyTitle = journey ? journey.title : null;

      const emailData = {
        to: user.email,
        subject: `Check-in Reminder: ${goalTitle}`,
        template: 'checkinReminder',
        data: {
          firstName: user.firstName,
          goalTitle,
          journeyTitle,
          scheduledTime,
          checkInId: checkIn._id,
          frequency: checkIn.frequency,
          description: checkIn.description || `Regular ${checkIn.frequency} check-in for your goal progress`
        }
      };

      await sendEmail(emailData);
      
      return {
        type: 'email',
        recipient: user.email,
        checkInId: checkIn._id,
        sentAt: new Date(),
        status: 'sent'
      };
    } catch (error) {
      console.error('Error sending email reminder:', error);
      return {
        type: 'email',
        recipient: user.email,
        checkInId: checkIn._id,
        sentAt: new Date(),
        status: 'failed',
        error: error.message
      };
    }
  }

  // Send push notification reminder
  static async sendPushReminder(checkIn, user, goal, journey) {
    try {
      // This would integrate with a push notification service like Firebase
      // For now, we'll simulate the functionality
      const notificationData = {
        title: `Check-in Reminder: ${goal.title}`,
        body: `It's time for your ${checkIn.frequency} check-in!`,
        data: {
          checkInId: checkIn._id.toString(),
          goalId: goal._id.toString(),
          type: 'checkin_reminder'
        }
      };

      // TODO: Implement actual push notification sending
      console.log('Push notification would be sent:', notificationData);
      
      return {
        type: 'push',
        recipient: user._id,
        checkInId: checkIn._id,
        sentAt: new Date(),
        status: 'sent',
        data: notificationData
      };
    } catch (error) {
      console.error('Error sending push reminder:', error);
      return {
        type: 'push',
        recipient: user._id,
        checkInId: checkIn._id,
        sentAt: new Date(),
        status: 'failed',
        error: error.message
      };
    }
  }

  // Create in-app notification
  static async createInAppReminder(checkIn, user, goal, journey) {
    try {
      // This would create a notification record in the database
      // For now, we'll simulate the functionality
      const notificationData = {
        userId: user._id,
        type: 'checkin_reminder',
        title: `Check-in Reminder: ${goal.title}`,
        message: `It's time for your ${checkIn.frequency} check-in!`,
        data: {
          checkInId: checkIn._id,
          goalId: goal._id,
          scheduledDate: checkIn.scheduledDate
        },
        isRead: false,
        createdAt: new Date()
      };

      // TODO: Implement actual in-app notification creation
      console.log('In-app notification would be created:', notificationData);
      
      return {
        type: 'in-app',
        recipient: user._id,
        checkInId: checkIn._id,
        sentAt: new Date(),
        status: 'created',
        data: notificationData
      };
    } catch (error) {
      console.error('Error creating in-app reminder:', error);
      return {
        type: 'in-app',
        recipient: user._id,
        checkInId: checkIn._id,
        sentAt: new Date(),
        status: 'failed',
        error: error.message
      };
    }
  }

  // Send overdue check-in notifications
  static async sendOverdueNotifications() {
    try {
      const overdueCheckIns = await CheckIn.find({
        status: { $in: ['scheduled', 'pending'] },
        scheduledDate: { $lt: new Date() }
      })
      .populate('user', 'email firstName lastName preferences')
      .populate('goal', 'title category')
      .populate('journey', 'title');

      const notifications = [];
      
      for (const checkIn of overdueCheckIns) {
        const notification = await this.sendOverdueNotification(checkIn);
        if (notification) {
          notifications.push(notification);
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error sending overdue notifications:', error);
      throw new Error(`Failed to send overdue notifications: ${error.message}`);
    }
  }

  // Send individual overdue notification
  static async sendOverdueNotification(checkIn) {
    try {
      const user = checkIn.user;
      const goal = checkIn.goal;
      const journey = checkIn.journey;

      if (!user || !goal) {
        console.error('Missing user or goal data for overdue notification');
        return null;
      }

      const scheduledTime = new Date(checkIn.scheduledDate).toLocaleString();
      const overdueHours = Math.floor((new Date() - checkIn.scheduledDate) / (1000 * 60 * 60));

      const emailData = {
        to: user.email,
        subject: `Overdue Check-in: ${goal.title}`,
        template: 'overdueCheckin',
        data: {
          firstName: user.firstName,
          goalTitle: goal.title,
          journeyTitle: journey ? journey.title : null,
          scheduledTime,
          overdueHours,
          checkInId: checkIn._id,
          frequency: checkIn.frequency
        }
      };

      await sendEmail(emailData);
      
      return {
        type: 'email',
        recipient: user.email,
        checkInId: checkIn._id,
        sentAt: new Date(),
        status: 'sent',
        notificationType: 'overdue'
      };
    } catch (error) {
      console.error('Error sending overdue notification:', error);
      return {
        type: 'email',
        recipient: user.email,
        checkInId: checkIn._id,
        sentAt: new Date(),
        status: 'failed',
        error: error.message,
        notificationType: 'overdue'
      };
    }
  }

  // Send check-in completion confirmation
  static async sendCompletionConfirmation(checkIn) {
    try {
      const user = checkIn.user;
      const goal = checkIn.goal;
      const journey = checkIn.journey;

      if (!user || !goal) {
        console.error('Missing user or goal data for completion confirmation');
        return null;
      }

      const completedTime = new Date(checkIn.completedDate).toLocaleString();
      const nextCheckIn = checkIn.nextScheduledDate ? new Date(checkIn.nextScheduledDate).toLocaleString() : null;

      const emailData = {
        to: user.email,
        subject: `Check-in Completed: ${goal.title}`,
        template: 'checkinCompleted',
        data: {
          firstName: user.firstName,
          goalTitle: goal.title,
          journeyTitle: journey ? journey.title : null,
          completedTime,
          nextCheckIn,
          frequency: checkIn.frequency,
          progress: checkIn.progressAssessment?.overallProgress || 0,
          rating: checkIn.progressAssessment?.rating || 0
        }
      };

      await sendEmail(emailData);
      
      return {
        type: 'email',
        recipient: user.email,
        checkInId: checkIn._id,
        sentAt: new Date(),
        status: 'sent',
        notificationType: 'completion'
      };
    } catch (error) {
      console.error('Error sending completion confirmation:', error);
      return {
        type: 'email',
        recipient: user.email,
        checkInId: checkIn._id,
        sentAt: new Date(),
        status: 'failed',
        error: error.message,
        notificationType: 'completion'
      };
    }
  }

  // Send weekly/monthly progress summary
  static async sendProgressSummary(userId, timeRange = 'week') {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get check-in statistics for the time range
      const CheckInService = require('./checkinService');
      const analytics = await CheckInService.getCheckInAnalytics(userId, timeRange);

      const emailData = {
        to: user.email,
        subject: `Your ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}ly Progress Summary`,
        template: 'progressSummary',
        data: {
          firstName: user.firstName,
          timeRange,
          totalCheckIns: analytics.total,
          completedCheckIns: analytics.completed,
          missedCheckIns: analytics.missed,
          completionRate: analytics.completionRate,
          averageRating: analytics.averageRating,
          averageProgress: analytics.averageProgress,
          averageMood: analytics.averageMood
        }
      };

      await sendEmail(emailData);
      
      return {
        type: 'email',
        recipient: user.email,
        userId,
        sentAt: new Date(),
        status: 'sent',
        notificationType: 'progress_summary',
        timeRange
      };
    } catch (error) {
      console.error('Error sending progress summary:', error);
      return {
        type: 'email',
        recipient: 'unknown',
        userId,
        sentAt: new Date(),
        status: 'failed',
        error: error.message,
        notificationType: 'progress_summary'
      };
    }
  }

  // Schedule recurring notifications
  static async scheduleRecurringNotifications() {
    try {
      // This would be called by a cron job or scheduler
      // Send reminders for upcoming check-ins
      const reminders = await this.sendCheckInReminders();
      
      // Send overdue notifications
      const overdueNotifications = await this.sendOverdueNotifications();
      
      // Mark overdue check-ins as missed
      const CheckInService = require('./checkinService');
      const markedOverdue = await CheckInService.markOverdueCheckIns();

      return {
        reminders,
        overdueNotifications,
        markedOverdue: markedOverdue.length
      };
    } catch (error) {
      console.error('Error scheduling recurring notifications:', error);
      throw new Error(`Failed to schedule recurring notifications: ${error.message}`);
    }
  }

  // Get notification preferences for a user
  static async getUserNotificationPreferences(userId) {
    try {
      const user = await User.findById(userId).select('preferences');
      if (!user) {
        throw new Error('User not found');
      }

      return {
        email: user.preferences?.notifications?.email ?? true,
        push: user.preferences?.notifications?.push ?? true,
        inApp: true // Always enabled for in-app notifications
      };
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw new Error(`Failed to get notification preferences: ${error.message}`);
    }
  }

  // Update notification preferences for a user
  static async updateUserNotificationPreferences(userId, preferences) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.preferences = {
        ...user.preferences,
        notifications: {
          ...user.preferences?.notifications,
          ...preferences
        }
      };

      await user.save();
      return user.preferences.notifications;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw new Error(`Failed to update notification preferences: ${error.message}`);
    }
  }
}

module.exports = NotificationService;
