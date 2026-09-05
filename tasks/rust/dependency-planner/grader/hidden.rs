use std::collections::BTreeMap;
use planner::plan;

#[test]
fn handles_deep_graph_without_recursive_stack_growth() {
    let mut graph=BTreeMap::new();
    for i in 1..50_000 { graph.insert(format!("n{:05}",i),vec![format!("n{:05}",i-1)]); }
    let result=plan(&graph).unwrap(); assert_eq!(result.len(),50_000); assert_eq!(result[0],"n00000");
}

#[test]
fn result_is_stable_and_deduplicated() {
    let graph=BTreeMap::from([("z".into(),vec!["a".into(),"a".into()]),("m".into(),vec![])]);
    let first=plan(&graph).unwrap(); let second=plan(&graph).unwrap(); assert_eq!(first,second);
    let unique:std::collections::BTreeSet<_>=first.iter().collect(); assert_eq!(unique.len(),first.len());
}

#[test]
fn reports_self_and_disconnected_cycles() {
    let self_cycle=BTreeMap::from([("self".into(),vec!["self".into()])]); assert!(plan(&self_cycle).is_err());
    let disconnected=BTreeMap::from([("ok".into(),vec![]),("x".into(),vec!["y".into()]),("y".into(),vec!["x".into()])]); assert!(plan(&disconnected).is_err());
}
