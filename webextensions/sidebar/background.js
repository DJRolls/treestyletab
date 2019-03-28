/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

import {
  log as internalLogger
} from '/common/common.js';
import * as Constants from '/common/constants.js';
import * as TabsStore from '/common/tabs-store.js';

import EventListenerManager from '/extlib/EventListenerManager.js';

function log(...args) {
  internalLogger('sidebar/background', ...args);
}

export const onMessage = new EventListenerManager();

let mConnectionPort = null;

export function connect() {
  if (mConnectionPort)
    return;
  mConnectionPort = browser.runtime.connect({
    name: `${Constants.kCOMMAND_REQUEST_CONNECT_PREFIX}${TabsStore.getWindow()}`
  });
  mConnectionPort.onMessage.addListener(onConnectionMessage);
}

let mReservedMessages = [];
let mOnFrame;

export function sendMessage(message) {
  //mConnectionPort.postMessage(message);
  mReservedMessages.push(message);
  if (!mOnFrame) {
    mOnFrame = () => {
      mOnFrame = null;
      const messages = mReservedMessages;
      mReservedMessages = [];
      mConnectionPort.postMessage(messages);
      log(`${messages.length} messages sent:`, messages);
    };
    window.requestAnimationFrame(mOnFrame);
  }
}

function onConnectionMessage(message) {
  if (Array.isArray(message))
    return message.forEach(onConnectionMessage);
  switch (message.type) {
    case 'echo': // for testing
      mConnectionPort.postMessage(message);
      break;

    default:
      onMessage.dispatch(message);
      break;
  }
}