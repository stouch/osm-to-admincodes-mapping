For each `<country>.txt`, we need to ask ChatGPT to return admin areas in this format :

```json
[
    {
        "name": "Bourgogne-Franche-Comté",
        "intl_name": "(optional. see IT.txt)",
        "identifier": "BFG",
        "code": "27",
        "children": [
            {
                "name": "Saône-et-loire",
                "intl_name": "(optional. see IT.txt)",
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