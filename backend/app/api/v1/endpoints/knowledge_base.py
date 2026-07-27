from fastapi import APIRouter
from app.services.farm_knowledge_base import FarmKnowledgeBase

router = APIRouter()

@router.get("/search")
def search_knowledge_base(query: str = ""):
    """Searches Indic agricultural term mappings."""
    results = []
    query_lower = query.lower().strip()

    for alias, (cat, subcat, lang) in FarmKnowledgeBase.TERM_MAPPINGS.items():
        if not query_lower or query_lower in alias.lower() or query_lower in cat.lower():
            results.append({
                "alias": alias,
                "canonical_name": subcat or cat,
                "category": cat,
                "subcategory": subcat,
                "language": lang
            })

    return {
        "query": query,
        "total_results": len(results),
        "categories": FarmKnowledgeBase.CATEGORIES,
        "results": results
    }
