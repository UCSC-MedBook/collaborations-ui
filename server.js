// publish the users collection for use in the search users functionality
Meteor.publish("/collaborations/searchUsers", function (searchText) {
  check(searchText, String);

  return findUsersPersonalCollabs(searchText);
});



function ensureObjectAccess (user, singleObject, obj) {
  // if it's a collaboration, they have to be an admin to access
  if (singleObject.collectionString === "Collaborations") {
    user.ensureAdmin(obj);
  } else {
    user.ensureAccess(obj);
  }
}

// publish a single object with collaboration security
Meteor.publish("/collaborations/singleObject", function (singleObject) {
  check(singleObject, singleObjectSchema);

  var user = MedBook.ensureUser(this.userId);
  var collection = MedBook.Collections[singleObject.collectionString];
  var obj = collection.findOne(singleObject.objectId);
  ensureObjectAccess(user, singleObject, obj);

  return collection.find({
    _id: singleObject.objectId
  });
});




Meteor.methods({
  "/collaborations/pushCollaborator": function (singleObject, collabName) {
    check(singleObject, singleObjectSchema);
    check(collabName, String);

    var user = MedBook.ensureUser(this.userId);
    var collection = MedBook.Collections[singleObject.collectionString];
    var obj = collection.findOne(singleObject.objectId);
    ensureObjectAccess(user, singleObject, obj);

    // if not a personal collaboration, make sure we have access
    // NOTE: anyone can add data to anyone's personal collaboration
    // NOTE: can't remove collaborations you don't have access to
    if (!collabName.startsWith("user:")) {
      user.ensureAccess(collabName);
    }

    var pushObject = {};
    pushObject[singleObject.editingField] = collabName;
    collection.update(singleObject.objectId, {
      $push: pushObject,
    });
  },
  "/collaborations/pullCollaborator": function (singleObject, collabName) {
    check(singleObject, singleObjectSchema);
    check(collabName, String);

    var user = MedBook.ensureUser(this.userId);
    var collection = MedBook.Collections[singleObject.collectionString];
    var obj = collection.findOne(singleObject.objectId);
    ensureObjectAccess(user, singleObject, obj);

    // if not a personal collaboration, make sure we have access
    // NOTE: anyone can add data to anyone's personal collaboration
    // NOTE: can't remove collaborations you don't have access to
    if (!collabName.startsWith("user:")) {
      user.ensureAccess(collabName);
    }

    // Make sure they're not removing the last collaborator of the
    // list (this would in practice "delete") the object by making
    // it impossible to access.
    // Removing all from "collaborators" is okay because the admins can still
    // access the object.
    var currentCollabs = obj[singleObject.editingField];
    if (singleObject.editingField !== "collaborators" &&
        currentCollabs.length === 1 && currentCollabs[0] === collabName) {
      throw new Meteor.Error("no-collaborators-would-remain",
          "By removing the last collaborator, the object would become " +
          "impossible to access.");
    }

    // actually do the remove
    var pullObject = {};
    pullObject[singleObject.editingField] = collabName;
    collection.update(singleObject.objectId, {
      $pull: pullObject,
    });

    // remove if there's no collaborations left (except if it's Collaborations)
    // This is where to write collection-specific remove code.
    if (singleObject.collectionString === "Collaborations") {
      // do nothing
    } else {
      collection.remove({
        _id: singleObject.objectId,
        collaborations: { $size: 0 },
      });
    }
  },
});
