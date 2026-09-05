import ProductPage from './pages/ProductPage';
import { HAOO_PRODUCT } from './products/haoo';

/**
 * One repository, one product, one document.
 *
 * This used to branch on `document.body.dataset.page`, because a single build published
 * both the ZERO-PAPER HUB site root and the nested HAOO product page and the runtime had
 * to tell them apart. Plan `04.2-02` split the two halves into separate repositories, so
 * the HAOO document is now this site's only page and the branch has no second arm to
 * select. It is removed rather than shrunk to a one-armed test: a branch that can only go
 * one way reads as a decision the code still makes, and the next reader would look for
 * the missing page.
 *
 * The ZERO-PAPER HUB home page, its company-profile download and its static content
 * collections are not deleted work — they travel to the ZERO-PAPER HUB repository in plan
 * `04.2-06`, and this repository's history still carries every one of their commits.
 */
export default function App() {
  return <ProductPage product={HAOO_PRODUCT} />;
}
