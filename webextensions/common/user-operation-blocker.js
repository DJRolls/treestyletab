/*
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
*/
'use strict';

import {
  log as internalLogger,
  configs
} from './common.js';
import * as Constants from './constants.js';
import * as TabsStore from './tabs-store.js';
import * as SidebarConnection from './sidebar-connection.js';

// eslint-disable-next-line no-unused-vars
function log(...args) {
  internalLogger('common/user-operation-blocker', ...args);
}

let mBlockingCount = 0;
let mBlockingThrobberCount = 0;
const mProgressbar = document.querySelector('#blocking-screen progress');

export function block(options = {}) {
  mBlockingCount++;
  document.documentElement.classList.add(Constants.kTABBAR_STATE_BLOCKING);
  if (options.throbber) {
    mBlockingThrobberCount++;
    mProgressbar.delayedShow = setTimeout(() => {
      mProgressbar.delayedShow = null;
      mProgressbar.classList.add('shown');
    }, configs.delayToShowProgressForBlockedUserOperation);
    document.documentElement.classList.add(Constants.kTABBAR_STATE_BLOCKING_WITH_THROBBER);
  }
}

export function setProgress(percentage, windowId = null) {
  percentage = Math.max(0, Math.min(100, percentage));
  if (mProgressbar)
    mProgressbar.value = percentage;
  if (windowId && !TabsStore.getWindow())
    SidebarConnection.sendMessage({
      type: Constants.kCOMMAND_PROGRESS_USER_OPERATIONS,
      windowId,
      percentage
    });
}

export function blockIn(windowId, options = {}) {
  const targetWindow = TabsStore.getWindow();
  if (targetWindow && targetWindow != windowId)
    return;

  if (!targetWindow) {
    SidebarConnection.sendMessage({
      type:     Constants.kCOMMAND_BLOCK_USER_OPERATIONS,
      windowId,
      throbber: !!options.throbber
    });
    return;
  }
  block(options);
}

export function unblock(_options = {}) {
  mBlockingThrobberCount--;
  if (mBlockingThrobberCount < 0)
    mBlockingThrobberCount = 0;
  if (mBlockingThrobberCount == 0) {
    setProgress(0);
    mProgressbar.classList.remove('shown');
    if (mProgressbar.delayedShow)
      clearTimeout(mProgressbar.delayedShow);
    document.documentElement.classList.remove(Constants.kTABBAR_STATE_BLOCKING_WITH_THROBBER);
  }

  mBlockingCount--;
  if (mBlockingCount < 0)
    mBlockingCount = 0;
  if (mBlockingCount == 0)
    document.documentElement.classList.remove(Constants.kTABBAR_STATE_BLOCKING);
}

export function unblockIn(windowId, options = {}) {
  const targetWindow = TabsStore.getWindow();
  if (targetWindow && targetWindow != windowId)
    return;

  if (!targetWindow) {
    SidebarConnection.sendMessage({
      type:     Constants.kCOMMAND_UNBLOCK_USER_OPERATIONS,
      windowId,
      throbber: !!options.throbber
    });
    return;
  }
  unblock(options);
}

