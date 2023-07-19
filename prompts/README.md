For each `<country>.txt`, we need ChatGPT to generate admin areas (`./admin-areas/<country>.json`) in this format :

```json
[
    {
        "name": "Bourgogne-Franche-Comté",
        "identifier": "BFG",
        "code": "27",
        "children": [
            {
                "name": "Saône-et-loire",
                "code": "71"
            },
            ...
        ]
    },
    ...
]
```

Note that the parent administrative areas can be regions, provinces, cantons, etc.
Children can be counties, _départements_, but even regions etc.
