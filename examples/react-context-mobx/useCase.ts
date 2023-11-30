const TutorialProgressBar = observer(() => {
	const { tutorialStore } = useContext(storesContext);
	const { colors } = useTheme();

	return (
		<View style={styles.gameProgressBar}>
			<View style={styles.textBarContainer}>
				<Text style={{
					color: colors.text
				}}>{tutorialStore.currentLesson.index} / {tutorialStore.currentCategoryLength}</Text>
			</View>
			<ProgressBar percent={(tutorialStore.currentLesson.index / tutorialStore.currentCategoryLength) * 100} />
		</View>
	);
});
