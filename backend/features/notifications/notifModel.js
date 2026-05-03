// features/notifications/notifModel.js
// saves in-app notifications to the Notifications table
// called alongside every email send so users see alerts inside the app too

const { sql, poolPromise } = require('../../config/db');

// insert one notification row
const createNotification = async ({ userID, title, message, type }) => {
  const pool = await poolPromise;
  await pool.request()
    .input('userID',  sql.Int,      userID)
    .input('title',   sql.NVarChar, title)
    .input('message', sql.NVarChar, message)
    .input('type',    sql.NVarChar, type)
    .query(`
      insert into Notifications (UserID, Title, Message, Type)
      values (@userID, @title, @message, @type)
    `);
};

// get all notifications for a user, newest first
const getNotifications = async (userID) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('userID', sql.Int, userID)
    .query(`
      select NotificationID, Title, Message, Type, IsRead, CreatedAt
      from Notifications
      where UserID = @userID
      order by CreatedAt desc
    `);
  return result.recordset;
};

// mark one notification as read
const markRead = async (notifID, userID) => {
  const pool = await poolPromise;
  await pool.request()
    .input('notifID', sql.Int, notifID)
    .input('userID',  sql.Int, userID)
    .query(`
      update Notifications
      set IsRead = 1
      where NotificationID = @notifID and UserID = @userID
    `);
};

// mark all as read for a user
const markAllRead = async (userID) => {
  const pool = await poolPromise;
  await pool.request()
    .input('userID', sql.Int, userID)
    .query(`update Notifications set IsRead = 1 where UserID = @userID`);
};

// count unread for badge display
const countUnread = async (userID) => {
  const pool = await poolPromise;
  const result = await pool.request()
    .input('userID', sql.Int, userID)
    .query(`select count(*) as UnreadCount from Notifications where UserID = @userID and IsRead = 0`);
  return result.recordset[0].UnreadCount;
};

module.exports = { createNotification, getNotifications, markRead, markAllRead, countUnread };