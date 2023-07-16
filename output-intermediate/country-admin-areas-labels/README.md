For each `<country>.json`, we need admin areas in this format :

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