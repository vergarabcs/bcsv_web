# TODO List

Quick-reference action items. See [PROJECT_SUGGESTIONS.md](./PROJECT_SUGGESTIONS.md) for detailed analysis.

## 🔴 Critical (Do First)

- [ ] Fix build infrastructure - run `npm install` to restore dependencies
- [ ] Verify `npm run lint` and `npm run build` work
- [ ] Add GitHub Actions CI workflow
- [ ] Add unit tests for `app/doublesQueue/algorithms.ts`
- [ ] Add unit tests for `app/doublesQueue/useDoublesQueueStore.ts`

## 🟡 High Priority (Do Soon)

- [ ] Implement export/import feature for Doubles Queue player database
- [ ] Add partnership rotation tracking (penalty for recent partners)
- [ ] Create Statistics screen with rating history graphs
- [ ] Add session history and trends
- [ ] Implement manual match override UI
- [ ] Add court maintenance status feature

## 🟢 Medium Priority (Nice to Have)

- [ ] Add PWA icons (currently empty in `public/icons/`)
- [ ] Improve offline functionality for Doubles Queue
- [ ] Add data backup/restore mechanism
- [ ] Document data persistence strategy
- [ ] Add JSDoc comments to complex algorithms
- [ ] Create architecture documentation
- [ ] Add e2e tests for badmintonScore app
- [ ] Add e2e tests for word-factory app

## 🔵 Enhancements (Future)

- [ ] Analytics dashboard for player performance trends
- [ ] Multi-language support (i18n)
- [ ] Social features (QR check-in, sharing, leaderboards)
- [ ] Tournament bracket system
- [ ] Advanced scheduling features
- [ ] Training tracker app

## 🧹 Maintenance

- [ ] Remove duplicate dictWithDef.ts (exists in 2 locations, 18MB each)
- [ ] Run `npm audit` and fix security issues
- [ ] Update dependencies to latest versions
- [ ] Improve error handling and error boundaries
- [ ] Accessibility audit (WCAG compliance)
- [ ] Performance optimization (especially word-factory dict file)

## 📝 Documentation

- [ ] Document build and install process in README
- [ ] Add usage examples for each app in README
- [ ] Create contributing guidelines specific to this project
- [ ] Document the rating system with examples
- [ ] Add architecture decision records (ADRs)

---

**Usage**: Check off items as you complete them. Add new items as needed. Keep this list focused on actionable tasks.
