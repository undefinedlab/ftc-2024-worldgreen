const SocialIcon = ({ type }) => {
    return (
      <div className={styles.footer__icon_wrapper}>
        <Image src={`/images/${type}.png`} alt={type} width={24} height={24} />
      </div>
    );
  };