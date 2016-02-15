/*
Copyright 2015, 2016 OpenMarket Ltd

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

var React = require('react');
var sdk = require('../../index');
var dis = require("../../dispatcher");
var WhoIsTyping = require("../../WhoIsTyping");
var MatrixClientPeg = require("../../MatrixClientPeg");

module.exports = React.createClass({
    displayName: 'RoomStatusBar',

    propTypes: {
        // the room this statusbar is representing.
        room: React.PropTypes.object.isRequired,
        
        // a list of TabCompleteEntries.Entry objects
        tabCompleteEntries: React.PropTypes.array,

        // the number of messages which have arrived since we've been scrolled up
        numUnreadMessages: React.PropTypes.number,

        // true if there are messages in the room which had errors on send
        hasUnsentMessages: React.PropTypes.bool,

        // this is true if we are fully scrolled-down, and are looking at
        // the end of the live timeline.
        atEndOfLiveTimeline: React.PropTypes.bool,

        // true if there is an active call in this room (means we show
        // the 'Active Call' text in the status bar if there is nothing
        // more interesting)
        hasActiveCall: React.PropTypes.bool,

        // callback for when the user clicks on the 'resend all' button in the
        // 'unsent messages' bar
        onResendAllClick: React.PropTypes.func,

        // callback for when the user clicks on the 'scroll to bottom' button
        onScrollToBottomClick: React.PropTypes.func,
    },

    getInitialState: function() {
        return {
            syncState: MatrixClientPeg.get().getSyncState(),
        };
    },

    componentWillMount: function() {
        MatrixClientPeg.get().on("sync", this.onSyncStateChange);
    },

    componentWillUnmount: function() {
        // we may have entirely lost our client as we're logging out before clicking login on the guest bar...
        if (MatrixClientPeg.get()) {
            MatrixClientPeg.get().removeListener("sync", this.onSyncStateChange);
        }
    },

    onSyncStateChange: function(state, prevState) {
        if (state === "SYNCING" && prevState === "SYNCING") {
            return;
        }
        this.setState({
            syncState: state
        });
    },

    render: function() {
        var TabCompleteBar = sdk.getComponent('rooms.TabCompleteBar');
        var TintableSvg = sdk.getComponent("elements.TintableSvg");

        // no conn bar trumps unread count since you can't get unread messages
        // without a connection! (technically may already have some but meh)
        // It also trumps the "some not sent" msg since you can't resend without
        // a connection!
        if (this.state.syncState === "ERROR") {
            return (
                <div className="mx_RoomView_connectionLostBar">
                    <img src="img/warning.svg" width="24" height="23" title="/!\ " alt="/!\ "/>
                    <div className="mx_RoomView_connectionLostBar_textArea">
                        <div className="mx_RoomView_connectionLostBar_title">
                            Connectivity to the server has been lost.
                        </div>
                        <div className="mx_RoomView_connectionLostBar_desc">
                            Sent messages will be stored until your connection has returned.
                        </div>
                    </div>
                </div>
            );
        }

        if (this.props.tabCompleteEntries) {
            return (
                <div className="mx_RoomView_tabCompleteBar">
                    <div className="mx_RoomView_tabCompleteImage">...</div>
                    <div className="mx_RoomView_tabCompleteWrapper">
                        <TabCompleteBar entries={this.props.tabCompleteEntries} />
                        <div className="mx_RoomView_tabCompleteEol" title="->|">
                            <TintableSvg src="img/eol.svg" width="22" height="16"/>
                            Auto-complete
                        </div>
                    </div>
                </div>
            );
        }

        if (this.props.hasUnsentMessages) {
            return (
                <div className="mx_RoomView_connectionLostBar">
                    <img src="img/warning.svg" width="24" height="23" title="/!\ " alt="/!\ "/>
                    <div className="mx_RoomView_connectionLostBar_textArea">
                        <div className="mx_RoomView_connectionLostBar_title">
                            Some of your messages have not been sent.
                        </div>
                        <div className="mx_RoomView_connectionLostBar_desc">
                            <a className="mx_RoomView_resend_link"
                                onClick={ this.props.onResendAllClick }>
                            Resend all now
                            </a> or select individual messages to re-send.
                        </div>
                    </div>
                </div>
            );
        }

        // unread count trumps who is typing since the unread count is only
        // set when you've scrolled up
        if (this.props.numUnreadMessages) {
            var unreadMsgs = this.props.numUnreadMessages + " new message" + 
                (this.props.numUnreadMessages > 1 ? "s" : "");

            return (
                <div className="mx_RoomView_unreadMessagesBar" onClick={ this.props.onScrollToBottomClick }>
                    <img src="img/newmessages.svg" width="24" height="24" alt=""/>
                    {unreadMsgs}
                </div>
            );
        }

        var typingString = WhoIsTyping.whoIsTypingString(this.props.room);
        if (typingString) {
            return (
                <div className="mx_RoomView_typingBar">
                    <div className="mx_RoomView_typingImage">...</div>
                    <span className="mx_RoomView_typingText">{typingString}</span>
                </div>
            );
        }

        if (!this.props.atEndOfLiveTimeline) {
            return (
                <div className="mx_RoomView_scrollToBottomBar" onClick={ this.props.onScrollToBottomClick }>
                    <img src="img/scrolldown.svg" width="24" height="24" alt="Scroll to bottom of page" title="Scroll to bottom of page"/>
                </div>                        
            );
        }

        if (this.props.hasActiveCall) {
            return (
                <div className="mx_RoomView_callBar">
                    <img src="img/sound-indicator.svg" width="23" height="20"/>
                    <b>Active call</b>
                </div>
            );
        }

        return <div />;
    },
});
