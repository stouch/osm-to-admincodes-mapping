For each `<country>.txt`, we need ChatGPT to generate admin areas (`./admin-areas/<country>.json`) in this format :

```json
[
    {
        "name": "Bourgogne-Franche-Comté",
        "code": "FR-BFC",
        "children": [
            {
                "name": "Saône-et-loire",
                "code": "FR-71"
            },
            ...
        ]
    },
    ...
]
```

Note that the parent administrative areas can be regions, provinces, cantons, etc.
Children can be counties, _départements_, but even regions etc.
