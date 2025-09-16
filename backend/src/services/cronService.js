const cron = require('node-cron');
const NotificationService = require('./notificationService');
const CheckInService = require('./checkinService');

class CronService {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  // Start all cron jobs
  start() {
    if (this.isRunning) {
      console.log('Cron service is already running');
      return;
    }

    console.log('Starting cron service...');

    // Check-in reminders - run every hour
    this.scheduleJob('checkin-reminders', '0 * * * *', async () => {
      try {
        console.log('Running check-in reminders job...');
        const notifications = await NotificationService.sendCheckInReminders();
        console.log(`Sent ${notifications.length} check-in reminders`);
      } catch (error) {
        console.error('Error in check-in reminders job:', error);
      }
    });

    // Overdue check-ins - run every 6 hours
    this.scheduleJob('overdue-checkins', '0 */6 * * *', async () => {
      try {
        console.log('Running overdue check-ins job...');
        const notifications = await NotificationService.sendOverdueNotifications();
        const markedOverdue = await CheckInService.markOverdueCheckIns();
        console.log(`Sent ${notifications.length} overdue notifications, marked ${markedOverdue.length} as missed`);
      } catch (error) {
        console.error('Error in overdue check-ins job:', error);
      }
    });

    // Weekly progress summaries - run every Monday at 9 AM
    this.scheduleJob('weekly-summaries', '0 9 * * 1', async () => {
      try {
        console.log('Running weekly progress summaries job...');
        await this.sendWeeklyProgressSummaries();
      } catch (error) {
        console.error('Error in weekly summaries job:', error);
      }
    });

    // Monthly progress summaries - run on the 1st of every month at 9 AM
    this.scheduleJob('monthly-summaries', '0 9 1 * *', async () => {
      try {
        console.log('Running monthly progress summaries job...');
        await this.sendMonthlyProgressSummaries();
      } catch (error) {
        console.error('Error in monthly summaries job:', error);
      }
    });

    // Cleanup old notifications - run daily at 2 AM
    this.scheduleJob('cleanup-notifications', '0 2 * * *', async () => {
      try {
        console.log('Running cleanup job...');
        await this.cleanupOldNotifications();
      } catch (error) {
        console.error('Error in cleanup job:', error);
      }
    });

    this.isRunning = true;
    console.log('Cron service started successfully');
  }

  // Stop all cron jobs
  stop() {
    if (!this.isRunning) {
      console.log('Cron service is not running');
      return;
    }

    console.log('Stopping cron service...');
    
    for (const [name, job] of this.jobs) {
      job.destroy();
      console.log(`Stopped job: ${name}`);
    }
    
    this.jobs.clear();
    this.isRunning = false;
    console.log('Cron service stopped');
  }

  // Schedule a new job
  scheduleJob(name, schedule, task) {
    if (this.jobs.has(name)) {
      console.log(`Job ${name} already exists, stopping it first`);
      this.jobs.get(name).destroy();
    }

    const job = cron.schedule(schedule, task, {
      scheduled: false,
      timezone: 'UTC'
    });

    job.start();
    this.jobs.set(name, job);
    console.log(`Scheduled job: ${name} with schedule: ${schedule}`);
  }

  // Remove a specific job
  removeJob(name) {
    if (this.jobs.has(name)) {
      this.jobs.get(name).destroy();
      this.jobs.delete(name);
      console.log(`Removed job: ${name}`);
    } else {
      console.log(`Job ${name} not found`);
    }
  }

  // Get status of all jobs
  getStatus() {
    const status = {
      isRunning: this.isRunning,
      jobs: []
    };

    for (const [name, job] of this.jobs) {
      status.jobs.push({
        name,
        running: job.running,
        scheduled: job.scheduled
      });
    }

    return status;
  }

  // Send weekly progress summaries to all active users
  async sendWeeklyProgressSummaries() {
    try {
      const User = require('../models/User');
      const users = await User.find({ isActive: true }).select('_id email firstName preferences');

      const summaries = [];
      for (const user of users) {
        // Check if user wants weekly summaries
        if (user.preferences?.notifications?.email !== false) {
          const summary = await NotificationService.sendProgressSummary(user._id, 'week');
          summaries.push(summary);
        }
      }

      console.log(`Sent ${summaries.length} weekly progress summaries`);
      return summaries;
    } catch (error) {
      console.error('Error sending weekly progress summaries:', error);
      throw error;
    }
  }

  // Send monthly progress summaries to all active users
  async sendMonthlyProgressSummaries() {
    try {
      const User = require('../models/User');
      const users = await User.find({ isActive: true }).select('_id email firstName preferences');

      const summaries = [];
      for (const user of users) {
        // Check if user wants monthly summaries
        if (user.preferences?.notifications?.email !== false) {
          const summary = await NotificationService.sendProgressSummary(user._id, 'month');
          summaries.push(summary);
        }
      }

      console.log(`Sent ${summaries.length} monthly progress summaries`);
      return summaries;
    } catch (error) {
      console.error('Error sending monthly progress summaries:', error);
      throw error;
    }
  }

  // Cleanup old notifications and data
  async cleanupOldNotifications() {
    try {
      const CheckIn = require('../models/CheckIn');
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90); // 90 days ago

      // Mark very old pending check-ins as missed
      const oldPendingCheckIns = await CheckIn.find({
        status: { $in: ['scheduled', 'pending'] },
        scheduledDate: { $lt: cutoffDate }
      });

      let markedCount = 0;
      for (const checkIn of oldPendingCheckIns) {
        await checkIn.markMissed();
        markedCount++;
      }

      console.log(`Marked ${markedCount} old check-ins as missed`);

      // TODO: Clean up old notification logs, expired tokens, etc.
      // This would depend on your notification storage system

      return { markedOldCheckIns: markedCount };
    } catch (error) {
      console.error('Error in cleanup job:', error);
      throw error;
    }
  }

  // Manual trigger for testing
  async triggerJob(jobName) {
    try {
      switch (jobName) {
        case 'checkin-reminders':
          const reminders = await NotificationService.sendCheckInReminders();
          return { jobName, result: `Sent ${reminders.length} reminders` };

        case 'overdue-checkins':
          const overdueNotifications = await NotificationService.sendOverdueNotifications();
          const markedOverdue = await CheckInService.markOverdueCheckIns();
          return { 
            jobName, 
            result: `Sent ${overdueNotifications.length} overdue notifications, marked ${markedOverdue.length} as missed` 
          };

        case 'weekly-summaries':
          const weeklySummaries = await this.sendWeeklyProgressSummaries();
          return { jobName, result: `Sent ${weeklySummaries.length} weekly summaries` };

        case 'monthly-summaries':
          const monthlySummaries = await this.sendMonthlyProgressSummaries();
          return { jobName, result: `Sent ${monthlySummaries.length} monthly summaries` };

        case 'cleanup-notifications':
          const cleanupResult = await this.cleanupOldNotifications();
          return { jobName, result: cleanupResult };

        default:
          throw new Error(`Unknown job: ${jobName}`);
      }
    } catch (error) {
      console.error(`Error triggering job ${jobName}:`, error);
      throw error;
    }
  }

  // Get job schedules
  getJobSchedules() {
    return {
      'checkin-reminders': {
        schedule: '0 * * * *',
        description: 'Send check-in reminders every hour',
        nextRun: this.getNextRunTime('0 * * * *')
      },
      'overdue-checkins': {
        schedule: '0 */6 * * *',
        description: 'Check for overdue check-ins every 6 hours',
        nextRun: this.getNextRunTime('0 */6 * * *')
      },
      'weekly-summaries': {
        schedule: '0 9 * * 1',
        description: 'Send weekly progress summaries every Monday at 9 AM',
        nextRun: this.getNextRunTime('0 9 * * 1')
      },
      'monthly-summaries': {
        schedule: '0 9 1 * *',
        description: 'Send monthly progress summaries on the 1st of every month at 9 AM',
        nextRun: this.getNextRunTime('0 9 1 * *')
      },
      'cleanup-notifications': {
        schedule: '0 2 * * *',
        description: 'Cleanup old notifications daily at 2 AM',
        nextRun: this.getNextRunTime('0 2 * * *')
      }
    };
  }

  // Calculate next run time for a cron expression
  getNextRunTime(cronExpression) {
    try {
      const cronParser = require('cron-parser');
      const interval = cronParser.parseExpression(cronExpression);
      return interval.next().toDate();
    } catch (error) {
      return null;
    }
  }
}

// Create singleton instance
const cronService = new CronService();

module.exports = cronService;
