import "firebase/analytics";
import firebase from "firebase/app";

export const selectContent = (type, id, items = []) => {
  const analytics = firebase.analytics();
  analytics.logEvent("select_content", {
    content_type: type,
    content_id: id,
    ...(items.length > 0 && {
      items: items
    })
  });
};

export const searchEvent = searchTerm => {
  const analytics = firebase.analytics();
  analytics.logEvent("search", {
    search_term: searchTerm
  });
};
