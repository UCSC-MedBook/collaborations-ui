// used to validate the object used to describe a single object when a user
// is editing its collaborations
singleObjectSchema = new SimpleSchema({
  collectionString: {
    type: String,
    allowedValues: [
      "SampleGroups",
      "Collaborations",
      "Studies",
    ],
  },
  objectId: { type: String },
  editingField: {
    type: String,
    allowedValues: [
      "collaborations",
      "collaborators",
      "administrators",
    ],
    // TODO: custom: only allow collaborators/administrators
    // if collectionString === "Collaborations"
  },
});

// bring up the modal that allows you to edit the collaborators of an object
MedBook.editCollaborations =
    function (collectionString, objectId, editingField) {
  if (!editingField) { // default: works for most objects
    editingField = "collaborations";
  }

  var singleObject = {
    collectionString: collectionString,
    objectId: objectId,
    editingField: editingField,
  };
  check(singleObject, singleObjectSchema);

  Modal.show("collabsEditCollaborations", singleObject, {
    keyboard: false // don't close on ESC key
  });
};


// Search Meteor.users for where collaborations.personal contains searchText.
// used on both server and client
findUsersPersonalCollabs = function (searchText) {
  return Meteor.users.find({
    "collaborations.email_address": { $regex: new RegExp(searchText) }
  }, {
    limit: 3,
    fields: {
      // include so the query works on the client
      "collaborations.email_address": 1,
      "collaborations.personal": 1,
    },
  });
};
