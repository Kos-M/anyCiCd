
# 
    
## API Reference

#### Repository Events

```http
  GET /api/repo
```

##### Repository ☑️
- /api/repo/push
- /api/repo/create
- /api/repo/delete

##### Repository Branch/Tag ☑️
- /api/repo/branch/create
- /api/repo/branch/delete
- /api/repo/tag/create
- /api/repo/tag/delete

##### Repository Fork ⌛
- /api/repo/fork
##### Repository Release  ⌛
- /api/repo/release/publish
- /api/repo/release/update
- /api/repo/release/delete

#### Issue Events

```http
  GET /api/issues
```
##### Issues ⌛
- /api/issues/open
- /api/issues/close
- /api/issues/reopen
- /api/issues/update
##### Issue Labeled ⌛
- /api/issues/label/clear
- /api/issues/label/update
##### Issue Comment ⌛
- /api/issues/comment/create
- /api/issues/comment/update
- /api/issues/comment/delete
##### Issue Assigned ⌛
- /api/issues/assign
- /api/issues/unassign
##### Issue Milistoned ⌛
- /api/issues/milistone
- /api/issues/demilistone


```http
  GET /api/pull
```
##### Pull Request ⌛
- /api/pull/open
- /api/pull/close
- /api/pull/reopen
- /api/pull/update
##### Pull Request Labeled ⌛
- /api/pull/label/update
- /api/pull/label/clear
##### Pull Request Comment ⌛
- /api/pull/comment/create
- /api/pull/comment/delete
- /api/pull/comment/update
##### Pull Request Synchronized ⌛
- /api/pull/synced
##### Pull Request Assigned ⌛
- /api/pull/assign
- /api/pull/unassign
##### Pull Request Milistoned ⌛
- /api/pull/milistone
- /api/pull/demilistone
##### Pull Request Reviewed ⌛
- /api/pull/request/approve
- /api/pull/request/reject
- /api/pull/request/comment





## Development Status
- ⌛ Pending
- ☑️ Done










## Authors

- [@Kos-M](https://www.github.com/Kos-M)


## License

[MIT](https://choosealicense.com/licenses/mit/)


## Contributing

Contributions are always welcome!




