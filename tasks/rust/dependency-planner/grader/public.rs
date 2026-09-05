use std::collections::BTreeMap;
use planner::{plan, PlanError};

#[test]
fn orders_dependencies_before_dependents() {
    let graph=BTreeMap::from([("api".into(),vec!["db".into(),"auth".into()]),("auth".into(),vec!["db".into()])]);
    let result=plan(&graph).unwrap();
    let db=result.iter().position(|x|x=="db").expect("db missing");
    let auth=result.iter().position(|x|x=="auth").expect("auth missing");
    let api=result.iter().position(|x|x=="api").expect("api missing");
    assert!(db < auth); assert!(auth < api);
}

#[test]
fn returns_closed_cycle_witness() {
    let graph=BTreeMap::from([("a".into(),vec!["b".into()]),("b".into(),vec!["a".into()])]);
    let Err(PlanError::Cycle(path))=plan(&graph) else { panic!("expected typed cycle") };
    assert!(path.len() >= 2); assert_eq!(path.first(),path.last());
    for edge in path.windows(2) { assert!(graph.get(&edge[0]).is_some_and(|deps|deps.contains(&edge[1]))); }
}
