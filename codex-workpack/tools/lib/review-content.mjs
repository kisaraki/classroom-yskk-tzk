import { createHash } from 'node:crypto';

// v1 binds every content field, including unknown future fields. Only approval
// flags are excluded so marking already-reviewed content APPROVED changes no hash.
export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function contentHash(data, item) {
  const { items, linguisticReviewStatus, ...datasetContent } = data;
  const { linguisticReview, ...itemContent } = item;
  return createHash('sha256')
    .update(canonicalJson({ format: 'idiom-review-v1', datasetContent, itemContent }), 'utf8')
    .digest('hex');
}
