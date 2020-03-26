export function SelectContent(analytics, type, id, items = []) {
  analytics.logEvent("select_content", {
    content_type: type,
    content_id: id,
    ...(items.length > 0 && {
      items: items
    })
  });

  return null;
}

export function SearchEvent(analytics, searchTerm) {
  analytics.logEvent("search", {
    search_term: searchTerm
  });
  return null;
}
