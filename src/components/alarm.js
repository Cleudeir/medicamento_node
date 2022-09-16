import { NativeModules } from 'react-native';
import uuid from 'uuid/v4';

import React from 'react';
import {View, Text, Button, } from 'react-native';
import * as Calendar from 'expo-calendar';
import Notification from './Notification';



export default class Alarm {

  constructor (params = null) {
    this.uid = getParam(params, 'uid', uuid());
    this.enabled = getParam(params, 'enabled', true);
    this.title = getParam(params, 'title', 'Alarm');
    this.description = getParam(params, 'description', 'Wake up');
    this.hour = getParam(params, 'hour', new Date().getHours());
    this.minutes = getParam(params, 'minutes', new Date().getMinutes() + 1);
    this.snoozeInterval = getParam(params, 'snoozeInterval', 1);
    this.repeating = getParam(params, 'repeating', false);
    this.active = getParam(params, 'active', true);
    this.days = getParam(params, 'days', [new Date().getDay()]);
    this.saves = []
    this.CalendarId = false

    this.createCalendar()
  }

  static getEmpty () {
    return new Alarm({
      title: '',
      description: '',
      hour: 0,
      minutes: 0,
      repeating: false,
      days: [],
    });
  }

  toAndroid () {
    return {
      ...this,
      days: toAndroidDays(this.days)
    }
  }

  static fromAndroid (alarm) {
    alarm.days = fromAndroidDays(alarm.days);
    return new Alarm(alarm);
  }

  getTimeString () {
    const hour = this.hour < 10 ? '0' + this.hour : this.hour;
    const minutes = this.minutes < 10 ? '0' + this.minutes : this.minutes;
    return { hour, minutes };
  }

  getTime () {
    const timeDate = new Date();
    timeDate.setMinutes(this.minutes);
    timeDate.setHours(this.hour);
    return timeDate;
  }



  async createCalendar() {    
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === 'granted') {
        const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
        console.log('Here are all your calendars:');
        let id;
        [{id}] = calendars.filter(({ title }) => title === 'Expo Calendar')
        console.log('isExist', id)
        if (id === undefined) {
          const defaultCalendarSource = { isLocalAccount: true, name: 'Expo Calendar' };
          id = await Calendar.createCalendarAsync({
            title: 'Expo Calendar',
            color: 'blue',
            entityType: Calendar.EntityTypes.EVENT,
            sourceId: defaultCalendarSource.id,
            source: defaultCalendarSource,
            name: 'internalCalendarName',
            ownerAccount: 'personal',
            allowsModifications: true,
            isVisible: false,
            allowedReminders: ['ALARM', 'ALERT'],
            accessLevel: Calendar.CalendarAccessLevel.ROOT,
          });
          console.log(`Your new calendar ID is: ${newCalendarID}`);
        }
        this.CalendarId = id
      }
}
async getAllAlarms(){
  try {
    const result =  await Calendar.getEventAsync(useId, new Date(Date.now()),new Date(Date.now()+(365*24*60*60*1000)));
    console.log('Event saved successfully');
    return result
  } catch (e) {
    console.warn('Event not saved successfully', e.message);
  }
}

async  createAlarm (recurring = false)  {
  const timeInOneHour = new Date();
  timeInOneHour.setHours(timeInOneHour.getHours() + 1);
  const newEvent = {
    id: '2',
    alarms: [
      { relativeOffset: 0, method: Calendar.AlarmMethod.ALERT },
      { relativeOffset: 1, method: Calendar.AlarmMethod.ALERT },
      { relativeOffset: 2, method: Calendar.AlarmMethod.ALERT },
    ],
    title: this.title,
    allDay: false,
    startDate: new Date(Date.now()),
    endDate: timeInOneHour,
    notes: this.description,
    timeZone: "America/Sao_Paulo",
  };
  if (recurring) {
    newEvent.recurrenceRule = {
      occurrence: 5,
      frequency: 'daily',
    };
  }
  try {
    await Calendar.createEventAsync(this.CalendarId, newEvent);
    console.log('Event saved successfully');
  } catch (e) {
    console.warn('Event not saved successfully', e.message);
  }
}
}
function getParam (param, key, defaultValue) {
  try {
    if (param && (param[key] !== null || param[key] !== undefined)) {
      return param[key];
    } else {
      return defaultValue;
    }
  } catch (e) {
    return defaultValue;
  }
}

export function toAndroidDays (daysArray) {
  return daysArray.map(day => (day + 1) % 7);
}

export function fromAndroidDays (daysArray) {
  return daysArray.map(d => d === 0 ? 6 : d - 1);
}

