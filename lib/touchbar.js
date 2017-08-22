'use babel';

import TouchbarEditView from './touchbar-edit-view';
import {CompositeDisposable} from 'atom';

const {app, BrowserWindow, TouchBar} = require('remote')

const {
  TouchBarButton,
  TouchBarColorPicker,
  TouchBarGroup,
  TouchBarLabel,
  TouchBarPopover,
  TouchBarScrubber,
  TouchBarSegmentedControl,
  TouchBarSlider,
  TouchBarSpacer
} = TouchBar

const EditViewURI = 'atom://touchbar-edit-view'

const touchBarConfig = require("./config.json")
const emojis = require('./emoji.json')

let touchBarEnabled = false;

let globalTouchBar = undefined;

export default {

  touchbarView : null,
  modalPanel : null,
  subscriptions : null,

  config : {},

  activate(state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    const touchBar = this.arrayToTouchBarElements(touchBarConfig.elements)

    globalTouchBar = touchBar

    atom.getCurrentWindow().setTouchBar(touchBar)

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'touchbar:toggle': () => this.toggle()
    }));

    // Register command that opens the edit window
    // this.subscriptions.add(atom.commands.add('atom-workspace', {
    //   'touchbar:edit': () => this.openEditWindow()
    // }));
  },

  deactivate() {
    BrowserWindow.getFocusedWindow().setTouchBar(null)
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.touchbarView.destroy();
  },

  serialize() {
    // return {touchbarViewState: this.touchbarView.serialize()};
  },

  toggle() {
    BrowserWindow.getFocusedWindow().setTouchBar(touchBarEnabled
      ? null
      : globalTouchBar)
    touchBarEnabled = !touchBarEnabled
  },

  openEditWindow() {
    let tbev = new TouchbarEditView(EditViewURI)
    atom.workspace.open(tbev)
  },

  arrayToTouchBarElements(input) {
    let myTouchBarElements = []

    // map all touch bar elements from config and create equivalent objects
    input.map((e, i) => {
      switch (e.type) {
          case "icon-button":
            myTouchBarElements.push(new TouchBarButton({
              icon: e.icon,
              click: () => {
                atom.commands.dispatch(atom.views.getView(atom.workspace.getActiveTextEditor()), e.command);
              },
              // apply selected color only when there is one specified in config, otherwise use default color
              backgroundColor: (e.color
                ? e.color
                : null)
            }))
            break;

        case "button":
          // creating new button
          myTouchBarElements.push(new TouchBarButton({
            label: e.label,
            click: () => {
              atom.commands.dispatch(atom.views.getView(atom.workspace.getActiveTextEditor()), e.command);
            },
            // apply selected color only when there is one specified in config, otherwise use default color
            backgroundColor: (e.color
              ? e.color
              : null)
          }))
          break;

        case "label":
          // creating new label
          myTouchBarElements.push(new TouchBarLabel({label: e.label, textColor: e.color}))
          break;

        case "color-picker":
          // breating new color picker
          myTouchBarElements.push(new TouchBarColorPicker({
            change: (color) => {
              // inserts the current selected color
              // BUG: inserts a lot of colors when sliding over colors / color gradient
              atom.workspace.getActiveTextEditor().insertText(color)
            }
          }))
          break;

        case "spacer":
          // breating new color picker
          myTouchBarElements.push(new TouchBarSpacer({size: e.size}))
          break;

        case "group":
          myTouchBarElements.push(new TouchBarGroup({
            items: this.arrayToTouchBarElements(e.elements)
          }))
          break;

        case "popover":
          myTouchBarElements.push(new TouchBarPopover({
            label: e.label,
            items: this.arrayToTouchBarElements(e.elements)
          }))
          break;

        case "scrubber":
          myTouchBarElements.push(new TouchBarScrubber({
            items: emojis,
            highlight: (i) => {
              atom.workspace.getActiveTextEditor().insertText(emojis[i].label)
            },
            selectedStyle: "outline",
            overlayStyle: "outline",
            continuous: false
          }))
          break;

      }
    })

    return new TouchBar(myTouchBarElements)
  }
};
