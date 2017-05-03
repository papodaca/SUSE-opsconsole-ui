// (c) Copyright 2016 Hewlett Packard Enterprise Development LP
// base pageObject for stackable modals

var StackableModal = function() {
  // returns all visible stackable_modal containers
  this.stackable_container = $$('.stackable-modal-wrapper')
    .filter( function(modal) {
      return modal.isDisplayed();
    });

  // gets all content from the visible modals
  this.open_modals = this.stackable_container.$$('.stackable-modal-content');

  // gets the top modal and its close button
  this.top_modal = this.open_modals.last();
  this.top_close = this.top_modal.$('.close-button');
};

module.exports = StackableModal;
