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

'use strict';

var React = require("react");
var sdk = require("../../../index");
var classNames = require('classnames');

module.exports = React.createClass({
    displayName: 'AddressSelector',

    propTypes: {
        onSelected: React.PropTypes.func.isRequired,
        addressList: React.PropTypes.array.isRequired,
        truncateAt: React.PropTypes.number.isRequired,
        selected: React.PropTypes.number,
    },

    getInitialState: function() {
        return {
            selected: this.props.selected === undefined ? 0 : this.props.selected,
            hover: false,
        };
    },

    componentWillReceiveProps: function(props) {
        // Make sure the selected item isn't outside the list bounds
        var selected = this.state.selected;
        var maxSelected = this._maxSelected(props.addressList);
        if (selected > maxSelected) {
            this.setState({ selected: maxSelected });
        }
    },

    componentDidUpdate: function() {
        // As the user scrolls with the arrow keys keep the selected item
        // at the top of the window.
        if (this.scrollElement && this.props.addressList.length > 0 && !this.state.hover) {
            var elementHeight = this.addressListElement.getBoundingClientRect().height;
            this.scrollElement.scrollTop = (this.state.selected * elementHeight) - elementHeight;
        }
    },

    onKeyUpArrow: function() {
        if (this.state.selected > 0) {
            this.setState({
                selected: this.state.selected - 1,
                hover : false,
            });
        }
    },

    onKeyDownArrow: function() {
        if (this.state.selected < this._maxSelected(this.props.addressList)) {
            this.setState({
                selected: this.state.selected + 1,
                hover : false,
            });
        }
    },

    onKeyReturn: function() {
        this.selectAddress(this.state.selected);
    },

    onClick: function(index) {
        var self = this;
        return function() {
            self.selectAddress(index);
        };
    },

    onMouseEnter: function(index) {
        var self = this;
        return function() {
            self.setState({
                selected: index,
                hover: true,
            });
        };
    },

    onMouseLeave: function() {
        this.setState({ hover : false });
    },

    selectAddress: function(index) {
        this.props.onSelected(index);
        this.setState({ hover: false });
    },

    createAddressListTiles: function() {
        var self = this;
        var AddressTile = sdk.getComponent("elements.AddressTile");
        var maxSelected = this._maxSelected(this.props.addressList);
        var addressList = [];

        // Only create the address elements if there are address
        if (this.props.addressList.length > 0) {
            for (var i = 0; i <= maxSelected; i++) {
                var classes = classNames({
                    "mx_AddressSelector_addressListElement": true,
                    "mx_AddressSelector_selected": this.state.selected === i,
                });

                // NOTE: Defaulting to "vector" as the network, until the network backend stuff is done.
                // Saving the addressListElement so we can use it to work out, in the componentDidUpdate
                // method, how far to scroll when using the arrow keys
                addressList.push(
                    <div className={classes} onClick={this.onClick(i)} onMouseEnter={this.onMouseEnter(i)} onMouseLeave={this.onMouseLeave} key={i} ref={(ref) => { this.addressListElement = ref; }} >
                        <AddressTile user={this.props.addressList[i]} justified={true} networkName="vector" networkUrl="img/search-icon-vector.svg" />
                    </div>
                );
            }
        }
        return addressList;
    },

    _maxSelected: function(list) {
        var listSize = list.length === 0 ? 0 : list.length - 1;
        var maxSelected = listSize > (this.props.truncateAt - 1) ? (this.props.truncateAt - 1) : listSize
        return maxSelected;
    },

    render: function() {
        var classes = classNames({
            "mx_AddressSelector": true,
            "mx_AddressSelector_empty": this.props.addressList.length === 0,
        });

        return (
            <div className={classes} ref={(ref) => {this.scrollElement = ref}}>
                { this.createAddressListTiles() }
            </div>
        );
    }
});